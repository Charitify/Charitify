import { AuthService } from "../services";

const login = async (data) => {
  return AuthService.login(data);
};

const register = async (data) => {
  return AuthService.register(data);
};

const loginWithFacebook = (data) => {
  return AuthService.loginWithFacebook(data);
};

const logout = (data) => {
  return AuthService.logout(data);
};

export default { login, logout, register, loginWithFacebook };
