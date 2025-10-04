import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Services
import { OCRService } from '../../services/OCRService';
import { CameraService } from '../../services/CameraService';

// Hooks
import { useTheme } from '../../hooks/useTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CameraScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.back;

  const camera = useRef(null);
  
  const [isActive, setIsActive] = useState(false);
  const [flash, setFlash] = useState('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Animated values
  const focusPoint = useSharedValue({ x: 0, y: 0 });
  const focusOpacity = useSharedValue(0);
  const captureButtonScale = useSharedValue(1);
  const flashAnimation = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => setIsActive(false);
    }, [])
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Camera capture function
  const takePhoto = useCallback(async () => {
    try {
      if (camera.current && !isProcessing) {
        setIsProcessing(true);
        
        // Animate capture button
        captureButtonScale.value = withSpring(0.8, {}, () => {
          captureButtonScale.value = withSpring(1);
        });

        // Trigger flash animation
        if (flash === 'on') {
          flashAnimation.value = withTiming(1, { duration: 100 }, () => {
            flashAnimation.value = withTiming(0, { duration: 100 });
          });
        }

        // Capture photo
        const photo = await camera.current.takePhoto({
          flash: flash,
          qualityPrioritization: 'quality',
          enableAutoDistortionCorrection: true,
          enableAutoRedEyeReduction: true,
        });

        // Vibrate for feedback
        Vibration.vibrate(50);

        // Process the image with OCR
        await processReceiptImage(photo);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [flash, isProcessing, captureButtonScale, flashAnimation]);

  // Process receipt image with OCR
  const processReceiptImage = async (photo) => {
    try {
      // Show processing indicator
      setIsProcessing(true);

      // Process image with OCR service
      const ocrResult = await OCRService.processReceipt(photo.path);

      // Navigate to expense creation with OCR data
      navigation.navigate('CreateExpense', {
        receiptImage: photo,
        ocrData: ocrResult,
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert('Processing Error', 'Failed to process receipt. You can add details manually.');
      
      // Navigate to expense creation without OCR data
      navigation.navigate('CreateExpense', {
        receiptImage: photo,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle gallery selection
  const selectFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          processReceiptImage(response.assets[0]);
        }
      }
    );
  };

  // Handle screen tap for focus
  const handleScreenTap = (event) => {
    const { x, y } = event.nativeEvent;
    focusPoint.value = { x, y };
    focusOpacity.value = withTiming(1, { duration: 200 }, () => {
      focusOpacity.value = withTiming(0, { duration: 1000 });
    });

    // Focus camera at tapped point
    if (camera.current) {
      camera.current.focus({ x: x / screenWidth, y: y / screenHeight });
    }
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newZoom = Math.min(Math.max(zoom * event.scale, 1), 10);
      setZoom(newZoom);
    });

  // Animated styles
  const focusIndicatorStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: focusPoint.value.x - 25,
    top: focusPoint.value.y - 25,
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 25,
    opacity: focusOpacity.value,
  }));

  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureButtonScale.value }],
  }));

  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashAnimation.value,
  }));

  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-alt" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Camera permission is required to capture receipts
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Camera not available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Camera View */}
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.cameraContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleScreenTap}
            style={styles.cameraWrapper}
          >
            <Camera
              ref={camera}
              style={styles.camera}
              device={device}
              isActive={isActive}
              photo={true}
              zoom={zoom}
              enableZoomGesture={true}
            />
          </TouchableOpacity>
          
          {/* Focus Indicator */}
          <Animated.View style={focusIndicatorStyle} />
          
          {/* Flash Overlay */}
          <Animated.View style={[styles.flashOverlay, flashOverlayStyle]} />
        </View>
      </GestureDetector>

      {/* Top Controls */}
      <SafeAreaView style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, flash === 'on' && styles.activeControl]}
          onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
        >
          <Icon 
            name={flash === 'off' ? 'flash-off' : 'flash-on'} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Gallery Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={selectFromGallery}
          disabled={isProcessing}
        >
          <Icon name="photo-library" size={24} color="white" />
        </TouchableOpacity>

        {/* Capture Button */}
        <Animated.View style={captureButtonStyle}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isProcessing && styles.captureButtonDisabled
            ]}
            onPress={takePhoto}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingIndicator}>
                <Icon name="hourglass-empty" size={32} color="white" />
              </View>
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Manual Entry Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('CreateExpense')}
          disabled={isProcessing}
        >
          <Icon name="edit" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Receipt Capture Guide */}
      <View style={styles.guideContainer}>
        <View style={styles.receiptFrame} />
        <Text style={styles.guideText}>
          Align receipt within the frame
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 32,
    zIndex: 10,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  processingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
    zIndex: 5,
  },
  receiptFrame: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  guideText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default CameraScreen;