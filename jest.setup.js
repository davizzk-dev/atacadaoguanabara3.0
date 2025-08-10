// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock jsPDF para evitar problemas nos testes
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    setFont: jest.fn(),
    save: jest.fn(),
  }))
})

// Mock window.URL para evitar problemas
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

// Mock fetch
global.fetch = jest.fn() 