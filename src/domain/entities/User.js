export class User {
    constructor(id, email, username, password, bio, verified = false, isGuest = false) {
      this.id = id;
      this.email = email;
      this.username = username;
      this.password = password;
      this.bio = bio;
      this.verified = verified;
      this.isGuest = isGuest;
    }
  }