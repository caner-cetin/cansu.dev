import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import type AceEditor from 'react-ace';
import { Settings, useColorTheme, useRenderFirst } from 'src/services/settings';
import { initializeAce } from 'src/editor/config';
import { ColorThemeDropdown } from './ColorThemeDropdown';
import { RenderFirstDropdown } from './RenderFirstDropdown';

interface SettingsModalProps {
  code: React.MutableRefObject<AceEditor | null>;
  languageID: number;
  setLanguageID: React.Dispatch<React.SetStateAction<number>> | undefined;
  show: boolean;
  onHide: () => void;
}


export default function SettingsModal({ code, languageID, setLanguageID, show, onHide }: SettingsModalProps) {
  const [colorTheme, setColorTheme] = useColorTheme();
  const [oldColorTheme, setOldColorTheme] = useState(colorTheme)
  const [renderFirst, setRenderFirst] = useRenderFirst()
  const [oldRenderFirst, setOldRenderFirst] = useState(renderFirst)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (oldColorTheme !== colorTheme) {
      setOldColorTheme(colorTheme)
      if (!code.current) {
        initializeAce(code, colorTheme, languageID);
      }
      code.current?.editor?.setTheme(`ace/theme/${colorTheme}`);
      localStorage.setItem(Settings.COLOR_THEME, colorTheme);
    }
  }, [colorTheme])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to re render on changing old value>
  useEffect(() => {
    if (oldRenderFirst !== renderFirst) {
      setOldRenderFirst(renderFirst)
      localStorage.setItem(Settings.RENDER_FIRST, JSON.stringify(renderFirst))
    }
  }, [renderFirst])


  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-[#1e1e1e] border-b border-[#555568] text-[#a0a08b]">
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-[#1e1e1e] text-[#e9efec]">
        <ColorThemeDropdown colorTheme={colorTheme} setColorTheme={setColorTheme} />
        <RenderFirstDropdown renderFirst={renderFirst} setRenderFirst={setRenderFirst} />
      </Modal.Body>
      <Modal.Footer className="bg-[#1e1e1e] border-t border-[#555568]">
        <Button variant="secondary" onClick={onHide} className="text-[#e9efec] bg-[#504945] border-[#555568]">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
