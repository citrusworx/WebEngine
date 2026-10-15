import './signup.css';

function SignupForm() {
  return (
    <div className="flex col around items:center mt:10 pb:rel:10">
    <form className="" method="" action="">

    <h2 className="playfair:display text:xlg text:center">Signup</h2>
        <fieldset className="flex col center items:center w:40 m:auto rounded:md">
            <label htmlFor="username" className="poppins text:md mt:10">Username:
                     <input type="text" name="username" id="username"/></label><br />
            <label htmlFor="username" className="poppins text:md">Email: 
                    <input type="email" name="email" id="email"/></label><br />
            <label htmlFor="username" className="poppins text:md">Password: 
                    <input type="password" name="password" id="password"/></label><br />
            <label htmlFor="username" className="poppins text:md">Confirm Password: 
                    <input type="password" name="confirm-password" id="confirm-password"/></label><br />

            <fieldset className="mt:10">
                <h3 className="playfair:display text:lg">Interests</h3>
                    <label htmlFor="cooking" className="poppins text:md">Cooking 
                            <input type="checkbox" name="cooking" value="cooking" id="cooking" title="cooking-option"/></label><br />
                    <label htmlFor="diy" className="poppins text:md">DIY 
                            <input type="checkbox" name="diy" value="diy" id="diy" title="diy-option"/></label><br />
                    <label htmlFor="gardening" className="poppins text:md">Gardening 
                            <input type="checkbox" name="gardening" value="gardening" id="gardening" title="gardening-option"/></label><br />
                    <label htmlFor="crafts" className="poppins text:md">Crafts 
                            <input type="checkbox" name="crafts" value="crafts" id="crafts" title="crafts-option"/></label>                        
            </fieldset>
            
            <button
                className="mt:10 bg-red-400 h:5 w:20 text:white poppins text:md"
                onClick={(e) => {e.preventDefault();}}>
                Signup
            </button>
        </fieldset>
    </form>
    </div>
  )
}

export default SignupForm