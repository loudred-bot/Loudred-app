import React, { createContext, useState, useEffect, useContext } from 'react';
import { ipcRenderer } from 'electron';
import { BotContext } from './BotContext';
import { WebContentsContext } from './WebContentsContext';

export type DeviceInfo = {
  id: number;
  name: string;
};

type ContextType = {
  devices: DeviceInfo[];
  sample: number;
  startBroadcast: (device: DeviceInfo) => Promise<void>;
  stopBroadcast: () => Promise<void>;
};

export const PortAudioContext = createContext<ContextType>({
  devices: [],
  sample: 0,
  startBroadcast() {
    console.log('"startBroadcast()" not implemented yet');
    return Promise.resolve();
  },
  stopBroadcast() {
    console.log('"stopBroadcast()" not implemented yet');
    return Promise.resolve();
  },
});

export const PortAudioProvider: React.FC = ({ children }) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [sample, setSample] = useState(0);
  const { isLoggedIn } = useContext(BotContext);
  const { isReady } = useContext(WebContentsContext);

  useEffect(() => {
    if (isReady && isLoggedIn) {
      Promise.all([ipcRenderer.invoke('get-devices')]).then(([devices]) => {
        setDevices(devices);
      });
    }
  }, [isReady, isLoggedIn]);

  useEffect(() => {
    if (isReady && isLoggedIn) {
      let prev = 0;
      const listen = async () => {
        requestAnimationFrame(async (cur) => {
          if (cur - prev > 500) {
            prev = cur;
            const sample = await ipcRenderer.invoke('get-sample');
            setSample(sample);
          }
          listen();
        });
      };
      listen();
    }
  }, [isLoggedIn, isReady]);

  const startBroadcast = async (device: DeviceInfo) => {
    await ipcRenderer.invoke('start-broadcast', device);
  };

  const stopBroadcast = async () => {
    await ipcRenderer.invoke('stop-broadcast');
  };

  const value = {
    devices,
    sample,
    startBroadcast,
    stopBroadcast,
  };

  return (
    <PortAudioContext.Provider value={value}>
      {children}
    </PortAudioContext.Provider>
  );
};
