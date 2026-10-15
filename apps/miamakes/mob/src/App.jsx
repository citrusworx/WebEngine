
import React from 'react';
import { useState, useEffect } from 'react';
import {ActivityIndicator, View, Button, Text, StyleSheet} from 'react-native';
import loadFonts from './js/berillium-native/font/font';
import Login from './views/login';
import Dash from './views/dash/dash';



export default function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        await loadFonts();
        setFontLoaded(true);
      } catch (error) {
        console.error("Error loading fonts", error);
        // Optionally, handle the error more gracefully
      }
    }

    load();
  }, []);

  if (!fontLoaded) {
    return <View><ActivityIndicator size="large" /></View>;
  }



  return (
    <Login />
  );
}

