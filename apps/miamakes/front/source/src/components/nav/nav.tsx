
function NavDark() {
  return (
    <nav className="bg-red-500 flex items:center around w:full h:8">
        <ul className="flex items:center around poppins text:md w:40">
            <li>Home</li>
            <li>Recipes</li>
        </ul>
        <div className="flex row items:center text:white poppins">
          Other Stuff
        </div>
    </nav>
  )
}

export default NavDark;