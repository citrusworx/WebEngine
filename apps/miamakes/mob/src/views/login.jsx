
import {Button, View, StatusBar, StyleSheet,  Text, TextInput, TouchableOpacity} from 'react-native';
import { heading } from '../js/berillium-native/text/text';
import poppins from '../js/berillium-native/font/fonts';
import { margin } from '../js/berillium-native/spacing/margin';
import { login } from '../js/berillium-native/form/form';
import Bar from '../js/berillium-native/bar/bar';
import flex from '../js/berillium-native/flex/flex';
import {HomeIcon, MessagesIcon, UserIcon, SettingsIcon} from '../js/berillium-native/icon/icon';


const Login = () => {
  return (
    
    <View style={styles.container}>
        <View style={margin.top}>
        <Text style={poppins.heading}>Mia Makes</Text>
          <View style={margin.top}>
            <Text style={[heading.h2, poppins.headingLogin]}>Log In</Text>
            <TextInput style={[login.field, poppins.light]}/>
            <Text style={float.right}>Forgot Username?</Text>
          </View>

          <View style={margin.topMd}>
            <Text style={[heading.h2, poppins.headingLogin]}>Password</Text>
            <TextInput style={[login.field, poppins.light]}/>
            <Text style={float.right}>Forgot Password?</Text>
            <StatusBar />
          </View>

          <View style={[margin.topMd, {justifyContent: 'center', alignItems: 'center' }]}>
          <TouchableOpacity style={{backgroundColor: '#5B3D83', height: 35, width: 150, justifyContent: 'center', alignItems: 'center', borderRadius: 8}}>
                <Text style={[poppins.regular, {color: 'white'}]}>Login</Text>
            </TouchableOpacity>
          </View>

          <View style={[margin.topSm, {justifyContent: 'center', alignItems: 'center'}]}>
            <TouchableOpacity style={{backgroundColor: '#E15E5E', height: 35, width: 150, justifyContent: 'center', alignItems: 'center', borderRadius: 8}}>
                <Text style={[poppins.regular, {color: 'white'}]}>Signup</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text style={poppins.light}>A Beryl Labs application</Text>
        </View>
        
        <View style={[Bar.home, flex.row, flex.around, flex.center]}>
                <View style={{height: 48, width: 48}}><HomeIcon /></View>
                <View style={{height: 48, width: 48}}><UserIcon /></View>
                <View style={{height: 48, width: 48}}><MessagesIcon /></View>
                <View style={{height: 48, width: 48}}><SettingsIcon /></View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 45
  },
});

const float = StyleSheet.create({
  right: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  }
})

export default Login;

