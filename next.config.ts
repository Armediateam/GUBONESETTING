import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/dashboard/bookings",
        destination: "/bookings",
        permanent: true,
      },
      {
        source: "/dashboard/locations",
        destination: "/locations",
        permanent: true,
      },
      {
        source: "/dashboard/patients",
        destination: "/patients",
        permanent: true,
      },
      {
        source: "/dashboard/patients/:patientId",
        destination: "/patients/:patientId",
        permanent: true,
      },
      {
        source: "/dashboard/profile",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/dashboard/schedule",
        destination: "/schedule",
        permanent: true,
      },
      {
        source: "/dashboard/services",
        destination: "/services",
        permanent: true,
      },
      {
        source: "/dashboard/settings",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/dashboard/therapists",
        destination: "/therapists",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
