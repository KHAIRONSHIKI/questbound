import React, { createContext, useState, ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AlertType = 'success' | 'error' | 'confirm' | 'info';

type AlertOptions = {
  title: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
};

export const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = (newOptions: AlertOptions) => {
    setOptions({
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Batal',
      ...newOptions,
    });
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    if (options?.onConfirm) options.onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    if (options?.onCancel) options.onCancel();
    hideAlert();
  };

  const getIcon = () => {
    switch (options?.type) {
      case 'success': return <MaterialCommunityIcons name="check-circle" size={50} color="#4ade80" />;
      case 'error': return <MaterialCommunityIcons name="alert-circle" size={50} color="#f87171" />;
      case 'confirm': return <MaterialCommunityIcons name="help-circle" size={50} color="#60a5fa" />;
      default: return <MaterialCommunityIcons name="information" size={50} color="#cf77f3" />;
    }
  };

  const getBorderColor = () => {
    switch (options?.type) {
      case 'success': return '#4ade80';
      case 'error': return '#f87171';
      case 'confirm': return '#60a5fa';
      default: return '#cf77f3';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal visible={visible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.alertBox, { borderColor: getBorderColor() }]}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            
            <Text style={styles.title}>{options?.title}</Text>
            <Text style={styles.message}>{options?.message}</Text>
            
            <View style={styles.buttonContainer}>
              {options?.type === 'confirm' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>{options.cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: getBorderColor() }]} 
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnText}>{options?.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '85%',
    backgroundColor: '#1a1033',
    borderRadius: 20,
    borderWidth: 2,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#cf77f3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#a89fc0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2b1b46',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#443a67',
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#1a1033',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
