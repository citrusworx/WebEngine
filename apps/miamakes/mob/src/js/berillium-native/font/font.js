import * as Font from 'expo-font';

async function loadFonts() {
    await Font.loadAsync({
        'Poppins-Black': require('../../../assets/font/Poppins/Poppins-Black.ttf'),
        'Poppins-Regular': require('../../../assets/font/Poppins/Poppins-Regular.ttf'),
        'Poppins-Light': require('../../../assets/font/Poppins/Poppins-Light.ttf'),
        'Playfair-Regular': require('../../../assets/font/Playfair_Display/static/PlayfairDisplay-Regular.ttf'),
        'Playfair-Bold': require('../../../assets/font/Playfair_Display/static/PlayfairDisplay-Bold.ttf'),
        // Include other fonts here
    });
}

export default loadFonts
