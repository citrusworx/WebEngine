import {useState} from 'react'

function IngredientForm(){
    const [ingreds, setIngreds] = useState<string[]>([])
     const addIngredient = ()=> {
        setIngreds([...ingreds, `Ingredient ${ingreds.length + 1}:`])
     }

     return (
        <div>
        <fieldset id="ingreds-list">
            {ingreds.map((id) => (
                <div key={id}>
                    <label htmlFor="ingred name">{id} </label><input title="ingredient" placeholder="Potatoes" type="text" name="ingred" id={id} />
                    <br />
                </div>
            ))}
        </fieldset>
        <button 
        onClick={(e)=> {
            e.preventDefault();
            addIngredient();
            }}>
                Add Ingredient</button>
    </div>
     )
}

export default IngredientForm