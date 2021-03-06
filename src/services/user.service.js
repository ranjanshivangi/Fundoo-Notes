import User from '../models/user.model';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { sender } from '../utils/rabbitmq';


import * as Utils from '../utils/user.util';
import * as Helpers from '../utils/helper';

//create new user
export const userRegistration = async (body) => {
  //console.log("request:", req);
  const user = await User.findOne({ email: body.email })
  if (user == null) {
    const salt = await bcrypt.genSalt(10);
    body.password = await bcrypt.hash(body.password, salt);
    const data = await User.create(body);
    sender(data);
    return data;
  }else {    
    throw new Error ("User Already Exists") ;
  }
  };

  // login user
export const userLogin = async (body) => {
  const searchData = await User.findOne({ email: body.email})
  if (searchData == null) {
    return null;
  }else {
    const validPassword = await bcrypt.compare(body.password, searchData.password);
    if (validPassword) {
      const token = Utils.generatrToken(searchData);
      return token;
    }
    else {
      throw new Error("Password Invalid");
    }
  }
};

export const forgetPassword = async (body) => {
  //console.log(body);
  const data = await User.findOne({ email: body.email})
  //console.log(data);
  if (data == null) {
    throw new Error("email is not registered")
  }else {
    let token = jwt.sign({"email": data.email, "id": data._id}, process.env.SECRET_KEY2);
    const sendMail = await Helpers.sendMailTo(data.email, token);
    return sendMail;
  }
};

export const resetPassword = async (body) => {
  //console.log(body.password);
  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(body.password, salt);
  const data = await User.findByIdAndUpdate({_id: body.userID }, {$set: {password: newPassword}}, {new: true} );
  return data;
};