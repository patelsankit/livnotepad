// import { useEffect, useState } from "react";
// import "./App.css";
// import NotePad from "./NotePad";
// import { Link } from "react-router-dom";

// function App() {
//   useEffect(() => {
//     // Detect if the page was reloaded
//     if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
//       // Redirect to another domain
//       window.location.href = "https://livenotepad-five.vercel.app";
//     }
//   }, []); // Empty dependency array ensures it runs once on page load

//   return (
//     <>
//     <div className="grid justify-center items-center gap-4">
      
//     <h1 className="text-center">Hello!!</h1>
//     <Link to="https://livenotepad-five.vercel.app/" className="">https://livenotepad-five.vercel.app</Link>
//       {/* <NotePad /> */}
//     </div>
//     </>
//   );
// }

// export default App;


import { useEffect } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    // Redirect immediately on page load
    window.location.href = "https://livenotepad-five.vercel.app";
  }, []); // Empty dependency array ensures this runs only once when the component is mounted

  return null; // Return null because we don't want to render anything if we're redirecting
}

export default App;
