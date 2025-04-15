import { useState } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import HomePage from "./page/HomePage"
import RoomPage from "./page/RoomPage"

const App = () => {
  const [token, setToken] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage setToken={setToken} setUsername={setUsername} />} />
        <Route path="/room" element={<RoomPage token={token} username={username} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App