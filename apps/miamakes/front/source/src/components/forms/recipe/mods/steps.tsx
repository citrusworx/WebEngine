import {useState} from 'react'

function StepForm(){
    const [steps, setSteps] = useState<string[]>([])
    const addStep = () => {
        setSteps([...steps, `Step ${steps.length + 1}: `])
    }

    return (
        <div>
        <fieldset id="steps">
           {steps.map((id) => (
                <div key={Number(id) + 1}>
                    <label htmlFor="step num">{id}</label><input title="step" placeholder="Step" type="text" name="ingred" />
                    <br />
                </div>
            ))}

        </fieldset>
        <button onClick={ (e) => {
                e.preventDefault();
                addStep();
        }
        }> Add Step </button>
        </div>
    )
}

export default StepForm