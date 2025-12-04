export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface CustomerProfile {
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  region_code: string;
  region_name: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
}

export interface MePayload {
  user: AuthUser;
  profile: CustomerProfile;
}
