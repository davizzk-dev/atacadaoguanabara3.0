'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DesenvolvimentoPage() {
  const [showWarning, setShowWarning] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const router = useRouter()

  const handleDevButtonClick = () => {
    setShowWarning(true)
  }

  const handleContinueClick = () => {
    setShowWarning(false)
    setShowLogin(true)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (credentials.username === 'atacadaoguanabara@site' && credentials.password === 'Atacadao@secreto123') {
      // Define cookie e localStorage
      document.cookie = 'dev_authenticated=true; path=/; max-age=86400' // 24 horas
      localStorage.setItem('dev_authenticated', 'true')
      router.push('/')
    } else {
      setLoginError('Credenciais inválidas!')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }
        
        .background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ajcAt1TJWOEf0b4J5RbuZFuR5rzIrL.png');
          background-size: cover;
          background-position: center;
          filter: blur(8px);
          z-index: -2;
        }
        
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: -1;
        }
        
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        
        .logo {
          width: 120px;
          height: 120px;
          margin-bottom: 2rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .title {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        
        .atacadao {
          color: #f97316;
        }
        
        .guanabara {
          color: #1e3a8a;
        }
        
        .subtitle {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .description {
          color: #d1d5db;
          font-size: 1.125rem;
          margin-bottom: 2rem;
          max-width: 600px;
          line-height: 1.6;
        }
        
        .instagram-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: #f97316;
          color: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.125rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
        }
        
        .instagram-btn:hover {
          background: #ea580c;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(249, 115, 22, 0.6);
        }
        
        .footer {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          color: #9ca3af;
          font-size: 0.875rem;
        }
        
        .footer p {
          margin-bottom: 0.25rem;
        }
        
        .dev-button {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 20px;
          height: 20px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          color: rgba(255, 255, 255, 0.1);
          cursor: pointer;
          font-size: 8px;
          opacity: 0.1;
          z-index: 10000;
          border-radius: 2px;
        }
        
        .dev-button:hover {
          opacity: 0.3;
          background: rgba(0, 0, 0, 0.2);
        }
        
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
        }
        
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          text-align: center;
        }
        
        .modal-content h3 {
          color: #dc2626;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        
        .modal-content p {
          color: #374151;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .modal-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background: #dc2626;
          color: white;
        }
        
        .btn-primary:hover {
          background: #b91c1c;
        }
        
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #4b5563;
        }
        
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        
        .form-group label {
          color: #374151;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .form-group input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }
        
        .error-message {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .title {
            font-size: 2rem;
          }
          
          .subtitle {
            font-size: 1.25rem;
          }
          
          .description {
            font-size: 1rem;
          }
          
          .logo {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
      
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      
      <div className="background"></div>
      <div className="overlay"></div>
      
      <div className="container">
        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-54tFT7ZGqBbcuI9z1nHdv2GrO3pSx7.png" alt="Atacadão Guanabara Logo" className="logo" />
        
        <h1 className="title">
          <span className="atacadao">Atacadão</span> <span className="guanabara">Guanabara</span>
        </h1>
        
        <h2 className="subtitle">Site em Desenvolvimento</h2>
        
        <p className="description">
          Estamos trabalhando para trazer a melhor experiência para você. 
          Em breve, nosso site estará disponível com todas as novidades!
        </p>
        
        <a href="https://www.instagram.com/atacadaoguanabara" target="_blank" className="instagram-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Visite nosso Instagram
        </a>
        
        {/* Botão dev bem escondido */}
        <button 
          className="dev-button"
          onClick={handleDevButtonClick}
          title="dev"
        >
          dev
        </button>
      </div>
      
      <div className="footer">
        <p>&copy; 2025 Atacadão Guanabara. Todos os direitos reservados.</p>
        <p>Desenvolvido por Davi Kalebe</p>
      </div>
      
      {/* Modal de aviso */}
      {showWarning && (
        <div className="modal">
          <div className="modal-content">
            <h3>⚠️ ÁREA RESTRITA</h3>
            <p>
              Esta é uma área restrita destinada exclusivamente para desenvolvedores autorizados. 
              O acesso não autorizado é proibido e pode estar sujeito a penalidades legais.
            </p>
            <p>
              <strong>Apenas desenvolvedores com credenciais válidas podem prosseguir.</strong>
            </p>
            <div className="modal-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowWarning(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleContinueClick}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de login */}
      {showLogin && (
        <div className="modal">
          <div className="modal-content">
            <h3>🔐 Login de Desenvolvedor</h3>
            <p>Insira suas credenciais de desenvolvedor para acessar o sistema:</p>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Usuário:</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="form-group">
                <label>Senha:</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                  autoComplete="current-password"
                />
              </div>
              
              {loginError && (
                <div className="error-message">{loginError}</div>
              )}
              
              <div className="modal-buttons">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLogin(false)
                    setLoginError('')
                    setCredentials({ username: '', password: '' })
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
