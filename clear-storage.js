// Script para limpar localStorage e corrigir problema do admin preso
console.log('🧹 Limpando localStorage...')

// Limpar todos os dados do localStorage relacionados ao auth
if (typeof window !== 'undefined') {
  localStorage.removeItem('auth-storage')
  localStorage.removeItem('cart-storage')
  localStorage.removeItem('favorites-storage')
  
  // Limpar também cookies do NextAuth
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  console.log('✅ localStorage limpo!')
  console.log('🔄 Recarregando página...')
  window.location.reload()
} else {
  console.log('❌ Este script deve ser executado no browser')
}
