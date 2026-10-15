import React from 'react'

function Hero() {
  return (
    <header className="h:full w:full bg:blue-green-700 flex col center items:center">
        <h2 className="text:white text:xxlg playfair:display fade:in">Welcome to Mia Makes</h2>
        <p className="text:white text:xlg poppins fade:in">A DIY Treasure Trove</p>
            <div className="flex row between w:45 m:auto pt:rel:10">
              <button className="w:10 h:5 text:white text:md poppins bg-red-600">Recipes</button>
              <button className="w:10 h:5 text:white text:md poppins bg-red-600">Gardening</button>
              <button className="w:10 h:5 text:white text:md poppins bg-red-600">Crafts</button>
            </div>
    </header>
  )
}

export default Hero