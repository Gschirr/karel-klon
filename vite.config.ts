import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

function usbFallback(): Plugin {
  return {
    name: 'usb-fallback',
    closeBundle() {
      const bat = `@echo off\r\nstart "" chrome "--allow-file-access-from-files" "%~dp0index.html"\r\n`
      writeFileSync(resolve('dist', 'start.bat'), bat)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), usbFallback()],
  base: './',
})
