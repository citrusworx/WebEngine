export function Search() {
    return (
        <form type="search">
            <div row gap="1" centered height="10vh" width="100%">
            <div field width="90%">
                <input 
                    type="text"
                    placeholder="Search for your domain name" 
                    scale="lg"
                    rounded    
                />
            </div>
            <button btn="flat" height="6vh" paddingX="1.5rem" theme="citrusmint-300">Search</button>
            </div>
        </form>
    )
}