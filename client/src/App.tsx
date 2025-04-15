import { BrowserRouter, Route, Routes } from "react-router-dom"
import HomePage from "./page/HomePage"
import { SocketProvider } from "./provider/SocketProvider"
import { PeerProvider } from "./provider/PeerProvider"
import { SOCKET_SERVER_URL } from "./constant"


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/" element={
          <SocketProvider url={SOCKET_SERVER_URL}>
            <PeerProvider>
              <HomePage />
            </PeerProvider>
          </SocketProvider>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App