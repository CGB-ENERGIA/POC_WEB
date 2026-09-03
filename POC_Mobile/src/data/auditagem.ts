export type AuditagemCategoria = "GOMAN" | "GSTC" | "ADMINISTRATIVO" | "ALOJAMENTO" | "LOGISTICA" | "OFICINA";

export const categoriasAuditagem: {
  value: AuditagemCategoria;
  label: string;
  descricao: string;
  icon: string;
}[] = [
  {
    value: "GOMAN",
    label: "GOMAN",
    descricao: "Gerência Operacional de Manutenção",
    icon: "mdi-wrench-outline",
  },
  {
    value: "GSTC",
    label: "GSTC",
    descricao: "Gerência de Serviços Técnicos e Construção",
    icon: "mdi-crane",
  },
];
