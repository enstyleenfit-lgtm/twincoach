export interface Member {
  id: string;
  name: string;
  plan: string;
  joinDate: string;
  lastVisitDate: string;
  visitInterval: string;
  riskScore: number;
  interventionStatus: string;
  recommendedIntervention: string;
  notes: string;
}

export interface Visit {
  id: string;
  memberId: string;
  visitDate: string;
}

export interface Intervention {
  id: string;
  memberId: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface Task {
  id: string;
  memberId: string;
  memberName: string;
  action: string;
  status: "pending" | "in progress" | "done";
  assignedTrainer: string;
  dueDate: string;
}
