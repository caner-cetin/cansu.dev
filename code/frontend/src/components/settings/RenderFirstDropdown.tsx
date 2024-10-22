import React from "react"
import { Dropdown } from "react-bootstrap"
import { RenderFirst } from "src/services/settings"

export interface RenderFirstDropdownProps {
  renderFirst: number
  setRenderFirst: (renderFirst: number) => void
}

export const RenderFirstDropdown = ({renderFirst, setRenderFirst}: RenderFirstDropdownProps) => {
  return (<Dropdown>
    <Dropdown.Toggle id='dropdown-basic' variant='link' style={{ color: '#e9efec' }} className='hover:bg-[#504945] transition-colors duration-200'>
      Set Initial View
    </Dropdown.Toggle>
    <span className="text-sm text-gray-400 ml-2">
      {renderFirst === RenderFirst.WelcomeMarkdown && 'README'}
      {renderFirst === RenderFirst.CodeEditor && 'Default Editor'}
    </span>
    <Dropdown.Menu className='scrollable-dropdown'>
      <Dropdown.Item onClick={() => setRenderFirst(RenderFirst.WelcomeMarkdown)}>README</Dropdown.Item>
      <Dropdown.Item onClick={() => setRenderFirst(RenderFirst.CodeEditor)}>Default Editor</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>)
}