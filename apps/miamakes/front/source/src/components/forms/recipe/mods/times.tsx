// Create the same thing for times as we did for steps and ingredients
function TimesForm(){
    return(
        <label><span className="playfair:display text:xlg">Times</span>
                    <p className="poppins:light text:md"> Please input the times it takes to prepare the ingredients and cooking the dish.</p>
                    <fieldset>
                            <span className="poppins text:md">Prep Time: </span><input className="w:3" type="text" name="prep time" id="prep time" />
                            <select>
                                    <option value="sec">sec</option>
                                    <option value="min">min</option>
                                    <option value="hr">hr</option>
                                    <option value="--">--</option>
                            </select><br />
                            <span className="poppins text:md">Cook Time: </span><input className="w:3" type="text" name="cook time" id="cook time" />
                            <select>
                                    <option value="sec">sec</option>
                                    <option value="min">min</option>
                                    <option value="hr">hr</option>
                                    <option value="--">--</option>
                            </select>
                            <div>
                                <button 
                                className="h:5 w:15 bg-red-500 text:white poppins"
                                onClick={(e) =>{e.preventDefault();}}
                                >Add times</button>
                            </div>
                        </fieldset></label>
    )
}
export {TimesForm}