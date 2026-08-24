"use client";
import { ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";
import "dayjs/locale/fr";
import dayjs from "dayjs";

// Semaine démarrant le lundi, cohérent avec les rapports côté serveur.
dayjs.locale("fr");

/**
 * Thème antd aligné sur le design system maison (marque, rayon, typo).
 * Appliqué globalement pour que tous les composants antd (Select, DatePicker…)
 * partagent le même rendu sans ConfigProvider par instance.
 */
export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: {
          colorPrimary: "#6366F1",
          borderRadius: 8,
          controlHeight: 36,
          fontFamily: "inherit",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
