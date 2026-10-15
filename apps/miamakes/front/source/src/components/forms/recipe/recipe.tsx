import { BasicInfo } from './mods/basic'
import IngredientForm from './mods/ingreds'
import StepForm from './mods/steps'
import { TimesForm } from './mods/times'


function RecipeAdd() {
  return (
    <div className="flex col w:65 m:auto pb:rel:10">
        <h2 className="text:xxlg playfair:display">Add a Recipe</h2>
        <form>
            {/* Container (row) */}
            <div className="flex around items:center">
            {/* Left  (col)*/}
            <div className="flex col w:30 bg:gray-200">
                <BasicInfo />
                <TimesForm />
            <label><span className="playfair:display text:xlg">Ingredients</span>
            <fieldset id="add-ingreds">
                <IngredientForm />
            </fieldset></label>
            <label><span className="playfair:display text:xlg">Directions</span><fieldset>
                    <StepForm />
                </fieldset></label>
            </div>
            
            {/* Right (col)*/}
            <div className="flex col w:30 bg:gray-200">
                <div>
                    <h2>Preview</h2>
                    <p>This is where a preview of the recipe will be.</p>
                </div>
            </div>
            </div>
            
        </form>
    </div>
  )
}

export {RecipeAdd}