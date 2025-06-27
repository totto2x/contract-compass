import React, { useState } from 'react';
import AuthWrapper from './components/auth/AuthWrapper';
import MainApp from './components/MainApp';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
      <AuthWrapper>
        {(user) => <MainApp user={user} />}
      </AuthWrapper>
    </>
  );
}

export default App;