import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect, useRef, useState } from 'react'
import AceEditor from 'react-ace'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import CustomToast from 'src/components/CustomToast'
import { initializeAce } from 'src/editor/config'
import { LANGUAGE_CONFIG } from 'src/editor/languages'
import { getSubmission, useJudge } from 'src/hooks/useJudge'
import Header from '../components/Header'
import OutputModal from '../components/OutputModal'
import 'ace-builds/src-noconflict/ext-language_tools'
import 'ace-builds/src-noconflict/ext-code_lens'
import 'ace-builds/src-noconflict/ext-error_marker'
import 'ace-builds/src-noconflict/ext-inline_autocomplete'
import 'ace-builds/src-noconflict/ext-settings_menu'
import 'ace-builds/src-noconflict/ext-statusbar'
import { LanguageId, useColorTheme } from 'src/services/settings'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/$token')({
  component: SharedCodePage,
})

export default function SharedCodePage() {
  const { token } = Route.useParams()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#211e20] text-[#e9efec] font-mono flex items-center justify-center">
        <h1 className="text-2xl text-center">
          Not usable on mobile/tablets. sowwy.
        </h1>
      </div>
    )
  }
  const [colorTheme] = useColorTheme()
  const code = useRef<AceEditor | null>(null)
  const JudgeAPI = useJudge()

  const query = useQuery({
    queryKey: ['submission', token],
    queryFn: () => getSubmission(token),
    refetchInterval: false,
    staleTime: Number.POSITIVE_INFINITY,
  })
  // biome-ignore lint/correctness/useExhaustiveDependencies: <we do not need to re-render upon language ID change>
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    initializeAce(
      code,
      colorTheme,
      query.data?.language_id || LanguageId.Python3,
    )
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  let loadingCodeToastID: string | undefined
  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to declare query data>
  useEffect(() => {
    if (!query.data) {
      loadingCodeToastID = toast.loading('loading source code')
      return
    }
    const language =
      LANGUAGE_CONFIG[query.data.language.id || LanguageId.Python3]
    language?.extensionModule().then(() => {
      code.current?.editor?.session.setMode(`ace/mode/${language?.mode}`)
      if (query.data) {
        code.current?.editor?.setValue(atob(query.data.source_code))
      } else {
        toast.error('could not load original source code. sowwy.')
        code.current?.editor?.setValue('')
      }
    })
    toast.dismiss(loadingCodeToastID)
  }, [query.isLoading])

  return (
    <div className="min-h-screen bg-[#211e20] text-[#e9efec] font-mono flex flex-col">
      <CustomToast />
      <Header
        code={code}
        languages={JudgeAPI.languages.data ?? []}
        displayingSharedCode={true}
        languageID={query.data?.language_id || LanguageId.Python3}
      />
      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={70} minSize={30}>
          <div
            style={{
              display: 'flex',
              height: '100vh',
              width: '100%',
              overflow: 'hidden',
              backgroundColor: '#1e1e1e',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <AceEditor
                mode="python"
                ref={code}
                theme="tomorrow_night_eighties"
                name="ace-editor"
                setOptions={{
                  readOnly: true,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-2 bg-[#3c3836] hover:bg-[#504945] cursor-col-resize" />
        <Panel defaultSize={30} minSize={20}>
          <div className="h-full bg-[#2c2a2a] p-4 overflow-y-auto">
            <OutputModal query={query} displayingSharedCode={true} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
