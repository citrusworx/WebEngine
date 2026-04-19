export function Footer(){
    return (
        <div>
            <footer height="30vh" width="100%" bgColor="black-500" font="korolev-rounded" padding="2rem">
                <div grid="3x3" fontColor="white-100">
                    <div span="1">Content</div>
                    <div span="1">Content</div>
                    <div span="1">
                        <nav type="footer">
                        <ul>
                            <li><a href="/" hoverText="orange-300">Home</a></li>
                        </ul>
                    </nav>
                    </div>
                </div>
            </footer>
        </div>
    )
}