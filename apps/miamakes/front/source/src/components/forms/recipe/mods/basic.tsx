function BasicInfo(){
    return(
        <>
            <h2 className="playfair:display text:xlg">Basic Info</h2>
                    <fieldset>
                        <label htmlFor="recipe-name">
                            <span className="poppins text:md">Name of Recipe: </span>
                            <input type="text" id="recipe name"/>
                        </label>
                            <br />
                        <label>
                            <span className="poppins text:md">Description</span>
                            <textarea></textarea>
                        </label>
                            <br />
                    </fieldset>
        </>
    )
}

export {BasicInfo}