import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { IonButton, IonContent, IonHeader, IonInput, IonLoading, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import {NetworkStatus} from "../network";

const log = getLogger('Login');

interface LoginState {
  username?: string;
  password?: string;
}

export const Login: React.FC<RouteComponentProps> = ({ history }) => {
  const { isAuthenticated, isAuthenticating, login, authenticationError } = useContext(AuthContext);
  const [state, setState] = useState<LoginState>({});
  const { username, password } = state;

  const handlePasswordChange = useCallback((e: any) => setState({
    ...state,
    password: e.detail.value || ''
  }), [state]);

  const handleUsernameChange = useCallback((e: any) => setState({
    ...state,
    username: e.detail.value || ''
  }), [state]);

  const handleLogin = useCallback(() => {
    log('handleLogin...');
    login?.(username, password);
  }, [username, password]);

  log('render');
  useEffect(() => {
    if (isAuthenticated) {
      log('redirecting to home');
      history.push('/');
    }
  }, [isAuthenticated]);

  return (
    <IonPage>
      <IonHeader>
        <NetworkStatus></NetworkStatus>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="flex flex-col items-center bg-gray-700 p-4 m-4 rounded shadow-lg shadow-gray-800">
          <IonInput
              placeholder="Username"
              value={username}
              onIonChange={handleUsernameChange}
              className="border-b-2"
          />
          <IonInput
              placeholder="Password"
              value={password}
              onIonChange={handlePasswordChange}
              className="border-b-2"
          />
          <IonLoading isOpen={isAuthenticating}/>
          {authenticationError && (
              <div>{authenticationError.message || 'Failed to authenticate'}</div>
          )}
          <IonButton onClick={handleLogin} className="mt-4">Log in</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};
