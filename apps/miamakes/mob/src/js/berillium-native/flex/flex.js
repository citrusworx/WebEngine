import { StyleSheet } from 'react-native';

const flex = StyleSheet.create({
    flex: {
        display: 'flex'
    },
    center: {
        alignItems: 'center'
    },
    around: {
        justifyContent: 'space-around'
    },
    between: {
        justifyContent: 'space-between'
    },
    evenly: {
        justifyContent: 'space-evenly'
    },
    end: {
        alignItems: 'flex-end'
    },
    start: {
        alignItems: 'flex-start'
    },
    nowrap: {
        flexWrap: 'nowrap'
    },
    wrap: {
        flexWrap: 'wrap'
    },
    wrapRev: {
        flexWrap: 'wrap-reverse'
    },
    row: {
        flexDirection: 'row'
    }
});

export default flex;
