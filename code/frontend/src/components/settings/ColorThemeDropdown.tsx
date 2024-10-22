import React from "react"
import { Dropdown } from "react-bootstrap"
import { Themes } from "src/services/settings"

export interface ColorThemeDropdownProps {
  colorTheme: string
  setColorTheme: (theme: Themes) => void
}

export const ColorThemeDropdown = ({ colorTheme, setColorTheme }: ColorThemeDropdownProps) => {
  return (<Dropdown>
    <Dropdown.Toggle id="dropdown-basic" variant="link" style={{ color: '#e9efec' }} className="hover:bg-[#504945] transition-colors duration-200">
      Color Theme
    </Dropdown.Toggle>
    <span className="text-sm text-gray-400 ml-2">
      {colorTheme === Themes.Chrome && 'Chrome'}
      {colorTheme === Themes.Clouds && 'Clouds'}
      {colorTheme === Themes.CrimsonEditor && 'Crimson Editor'}
      {colorTheme === Themes.Dawn && 'Dawn'}
      {colorTheme === Themes.Dreamweaver && 'Dreamweaver'}
      {colorTheme === Themes.Eclipse && 'Eclipse'}
      {colorTheme === Themes.GitHub && 'GitHub'}
      {colorTheme === Themes.IPlastic && 'IPlastic'}
      {colorTheme === Themes.KatzenMilch && 'KatzenMilch'}
      {colorTheme === Themes.Kuroir && 'Kuroir'}
      {colorTheme === Themes.SolarizedLight && 'Solarized Light'}
      {colorTheme === Themes.SQLServer && 'SQL Server'}
      {colorTheme === Themes.TextMate && 'TextMate'}
      {colorTheme === Themes.Tomorrow && 'Tomorrow'}
      {colorTheme === Themes.XCode && 'XCode'}
      {colorTheme === Themes.Ambiance && 'Ambiance'}
      {colorTheme === Themes.Chaos && 'Chaos'}
      {colorTheme === Themes.CloudsMidnight && 'Clouds Midnight'}
      {colorTheme === Themes.Cobalt && 'Cobalt'}
      {colorTheme === Themes.Dracula && 'Dracula'}
      {colorTheme === Themes.GreenOnBlack && 'Green on Black'}
      {colorTheme === Themes.Gruvbox && 'Gruvbox'}
      {colorTheme === Themes.IdleFingers && 'Idle Fingers'}
      {colorTheme === Themes.KrTheme && 'Kr Theme'}
      {colorTheme === Themes.Merbivore && 'Merbivore'}
      {colorTheme === Themes.MerbivoreSoft && 'Merbivore Soft'}
      {colorTheme === Themes.MonoIndustrial && 'Mono Industrial'}
      {colorTheme === Themes.Monokai && 'Monokai'}
      {colorTheme === Themes.PastelOnDark && 'Pastel on Dark'}
      {colorTheme === Themes.SolarizedDark && 'Solarized Dark'}
      {colorTheme === Themes.Terminal && 'Terminal'}
      {colorTheme === Themes.TomorrowNight && 'Tomorrow Night'}
      {colorTheme === Themes.TomorrowNightBlue && 'Tomorrow Night Blue'}
      {colorTheme === Themes.TomorrowNightBright && 'Tomorrow Night Bright'}
      {colorTheme === Themes.TomorrowNightEighties && 'Tomorrow Night Eighties'}
      {colorTheme === Themes.Twilight && 'Twilight'}
      {colorTheme === Themes.VibrantInk && 'Vibrant Ink'}
    </span>

    <Dropdown.Menu className='scrollable-dropdown' >
      <Dropdown.Item onClick={() => setColorTheme(Themes.Chrome)}>Chrome</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Clouds)}>Clouds</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.CrimsonEditor)}>Crimson Editor</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Dawn)}>Dawn</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Dreamweaver)}>Dreamweaver</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Eclipse)}>Eclipse</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.GitHub)}>GitHub</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.IPlastic)}>IPlastic</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.KatzenMilch)}>KatzenMilch</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Kuroir)}>Kuroir</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.SolarizedLight)}>Solarized Light</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.SQLServer)}>SQL Server</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.TextMate)}>TextMate</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Tomorrow)}>Tomorrow</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.XCode)}>XCode</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Ambiance)}>Ambiance</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Chaos)}>Chaos</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.CloudsMidnight)}>Clouds Midnight</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Cobalt)}>Cobalt</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Dracula)}>Dracula</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.GreenOnBlack)}>Green on Black</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Gruvbox)}>Gruvbox</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.IdleFingers)}>Idle Fingers</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.KrTheme)}>Kr Theme</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Merbivore)}>Merbivore</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.MerbivoreSoft)}>Merbivore Soft</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.MonoIndustrial)}>Mono Industrial</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Monokai)}>Monokai</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.PastelOnDark)}>Pastel on Dark</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.SolarizedDark)}>Solarized Dark</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Terminal)}>Terminal</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.TomorrowNight)}>Tomorrow Night</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.TomorrowNightBlue)}>Tomorrow Night Blue</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.TomorrowNightBright)}>Tomorrow Night Bright</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.TomorrowNightEighties)}>Tomorrow Night Eighties</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.Twilight)}>Twilight</Dropdown.Item>
      <Dropdown.Item onClick={() => setColorTheme(Themes.VibrantInk)}>Vibrant Ink</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>)
}