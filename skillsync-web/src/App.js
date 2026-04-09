import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import BeMentor from "./pages/BeMentor";
import FindMentor from "./pages/FindMentor";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Team from "./pages/Team";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/be-mentor" element={<BeMentor />} />
        <Route path="/find-mentor" element={<FindMentor />} />
	<Route path="/contact" element={<Contact />} />
	<Route path="/about" element={<About />} />
	<Route path="/team" element={<Team />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;