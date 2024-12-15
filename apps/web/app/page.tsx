import ScrollingRow from "@/components/landing/scrolling-row"

const slogans = [
  { text: "Welcome to our global community", language: "English", flag: "🇬🇧" },
  { text: "Bienvenido a nuestra comunidad global", language: "Spanish", flag: "🇪🇸" },
  { text: "Bienvenue dans notre communauté mondiale", language: "French", flag: "🇫🇷" },
  { text: "Willkommen in unserer globalen Gemeinschaft", language: "German", flag: "🇩🇪" },
  { text: "欢迎加入我们的全球社区", language: "Chinese", flag: "🇨🇳" },
  { text: "Benvenuti nella nostra comunità globale", language: "Italian", flag: "🇮🇹" },
  { text: "Добро пожаловать в наше глобальное сообщество", language: "Russian", flag: "🇷🇺" },
  { text: "グローバルコミュニティへようこそ", language: "Japanese", flag: "🇯🇵" },
  { text: "Bem-vindo à nossa comunidade global", language: "Portuguese", flag: "🇵🇹" },
  { text: "Welkom bij onze wereldwijde gemeenschap", language: "Dutch", flag: "🇳🇱" },
  { text: "Velkommen til vårt globale fellesskap", language: "Norwegian", flag: "🇳🇴" },
  { text: "Välkommen till vår globala gemenskap", language: "Swedish", flag: "🇸🇪" },
]

export default function LandingPage() {
  return (
      <div className="min-h-screen bg-gradient-to-b flex flex-col justify-center items-center p-4">
        <h1 className="text-7xl font-bold mb-8 text-center">Loqui</h1>
        <div className="w-full max-w-7xl space-y-12">
          <ScrollingRow slogans={slogans.slice(0, 4)} direction="left" />
          <ScrollingRow slogans={slogans.slice(4, 8)} direction="right" />
          <ScrollingRow slogans={slogans.slice(8, 12)} direction="left" />
        </div>
      </div>
  )
}

