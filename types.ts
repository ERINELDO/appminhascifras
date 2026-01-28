
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin?: boolean;
  licenseType?: string;
  whatsapp?: string;
  cpfCnpj?: string;
  ativo?: boolean;
  isBlocked?: boolean;
  lastSeenAt?: string;
  lastDevice?: string;
  lastIp?: string;
  active_license_id?: string;
  activeLicense?: License;
  password_hash?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
}

export type TransactionType = 'receita' | 'despesa' | 'reserva';
export type TransactionStatus = 'Pendente' | 'Efetivado' | 'Vencido';

export interface TransactionConfirmation {
  id: string;
  transactionId: string;
  amount: number;
  confirmedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  status: TransactionStatus;
  description: string;
  observation?: string;
  attachment?: string;
  isRecurring: boolean;
  frequency?: RecurrenceFrequency;
  recurrenceLimitType?: RecurrenceLimitType;
  recurrenceEndDate?: string;
  recurrenceCount?: number;
  recurrenceGroupId?: string;
  paymentDate?: string;
  confirmations?: TransactionConfirmation[];
}

export type RecurrenceFrequency = 'mensal' | 'quinzenal' | 'anual';
export type RecurrenceLimitType = 'forever' | 'until_date' | 'count';

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  location: string;
  quantity: string;
  value: number;
  date: string;
}

export interface InvestmentType {
  id: string;
  name: string;
  color: string;
}

export interface Withdrawal {
  id: string;
  investmentId: string;
  investmentName: string;
  quantity: string;
  value: number;
  date: string;
  observation: string;
  deviceIp: string;
  deviceType: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetValue: number;
  currentValue?: number;
  startDate: string;
  monthsForecast: number;
  targetDate: string;
  typeId?: string;
  typeName?: string;
  typeColor?: string;
  accountId?: string;
  accountName?: string;
  observation?: string;
  lastEntryValue?: number;
}

export interface GoalType {
  id: string;
  name: string;
  color: string;
}

export interface GoalAccount {
  id: string;
  name: string;
}

export interface GoalEntry {
  id: string;
  meta_id: string;
  amount: number;
  date: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  alert: boolean;
  alertTime?: string;
  isCompleted: boolean;
  attachment?: string;
}

export interface AppSettings {
  stripe_public_key: string;
  stripe_secret_key: string;
  logoUrl: string;
  logoUrlSidebar: string;
}

export type LicensePeriodType = 'Mensal' | 'Anual' | 'Vitalícia' | 'Trial';
export type LicenseStatus = 'Ativa' | 'Pendente' | 'Expirada';

export interface License {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  planId: string;
  name: string;
  type: LicensePeriodType;
  value: number;
  status: LicenseStatus;
  expirationDate?: string;
  frequency: string;
}

export interface LicensePlan {
  id: string;
  name: string;
  type: LicensePeriodType;
  price: number;
  description: string;
  stripePriceId?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  licenseId: string;
  amount: number;
  status: 'Pendente' | 'Pago';
  description: string;
  createdAt: string;
  confirmedAt?: string;
  invoiceUrl?: string;
}

export interface StudyCourse {
  id: string;
  name: string;
  category?: string;
  localEstudo?: string;
  status: 'Em andamento' | 'Concluído' | 'Pausado';
}

export interface StudyDiscipline {
  id: string;
  courseId: string;
  name: string;
  professor?: string;
  createdAt?: string;
}

export interface StudyTopic {
  id: string;
  disciplineId: string;
  name: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  createdAt?: string;
}

export interface StudyMockTest {
  id: string;
  dataSimulado: string;
  disciplinaNome: string;
  organizacaoSimulado: string;
  nQuestoes: number;
  horaInicio?: string;
  horaFim?: string;
  nAcertos: number;
  nErros: number;
  saldoSimulado: number;
  tempoTotal?: number;
}

export interface StudyExercise {
  id: string;
  idUsuario: string;
  idCurso?: string;
  idTopico?: string;
  cursoNome?: string;
  topicoNome?: string;
  dataPratica: string;
  disciplinaNome: string;
  nQuestoes: number;
  nAcertos: number;
  nErros: number;
  observacao?: string;
}

export interface StudySession {
  id: string;
  idUsuario: string;
  idDisciplina: string;
  idTopico: string;
  tipoEstudo: 'Teoria' | 'Revisao' | 'Exercicio';
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
}

export interface StudyPlan {
  id: string;
  idUsuario: string;
  cursoId: string;
  cursoNome?: string;
  idDisciplina: string;
  disciplinaNome?: string;
  idTopico: string;
  topicoNome?: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  tipoEstudo: string;
  color?: string;
  createdAt?: string;
}
