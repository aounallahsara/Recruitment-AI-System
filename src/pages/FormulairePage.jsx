import CandidatureForm from '../components/formulaire/CandidatureForm'
import ChatBot from '../components/chatbot/ChatBot'

function FormulairePage() {
  return (
    <div 
      className="min-h-screen py-12 px-4 relative"
      style={{
        backgroundImage: 'url(src/components/shared/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay transparent */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
      
      {/* Logo en haut à gauche */}
      <div className="absolute top-6 left-6 z-10">
        <img 
          src="src/components/shared/LogoBTPH.png" 
          alt="Logo" 
          className="h-32 w-auto"
        />
      </div>

      {/* Contenu */}
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Postulez pour un stage
          </h1>
          <p className="text-gray-700 text-lg">
            Remplissez le formulaire pour soumettre votre candidature
          </p>
        </div>
        
        <CandidatureForm />
      </div>
      
      <ChatBot />
    </div>
  )
}

export default FormulairePage