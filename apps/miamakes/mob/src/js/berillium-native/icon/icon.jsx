import React from 'react';
import { Image, View } from 'react-native';

const HomeIcon = () => {
  return (
    <View>
      <Image
        source={require('./material/png/home.png')}
        style={{height: 48, width: 48}}
      />
    </View>
  );
};

const UserIcon = () => {
    return (
      <View>
        <Image
          source={require('./material/png/account_circle.png')}
          style={{height: 48, width: 48}}
        />
      </View>
    );
  };

const MessagesIcon = () => {
return (
    <View>
    <Image
        source={require('./material/png/mail.png')}
        style={{height: 48, width: 48}}
    />
    </View>
);
};

const SettingsIcon = () => {
    return (
      <View>
        <Image
          source={require('./material/png/settings.png')}
          style={{height: 48, width: 48}}
        />
      </View>
    );
  };

export {HomeIcon, UserIcon, SettingsIcon, MessagesIcon}
