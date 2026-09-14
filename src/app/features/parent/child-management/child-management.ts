import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { Group } from '../../../core/groups/group';
import { IMember, MemberService } from '../../../core/members/member';

@Component({
  imports: [FormField],
  selector: 'app-child-management',
  styleUrl: './child-management.scss',
  templateUrl: './child-management.html',
})
export class ChildManagement {
  private readonly groupService = inject(Group);
  private readonly memberService = inject(MemberService);
  private readonly newChildModel = signal({ name: '' });
  private readonly editModel = signal({ name: '' });
  private readonly deleteModel = signal({ confirmation: '' });
  private readonly activeMember = signal<IMember | null>(null);
  private readonly dialogMode = signal<'edit' | 'delete' | null>(null);
  private readonly operationError = signal<string | null>(null);
  private readonly isSaving = signal(false);

  protected readonly newChildForm = form(this.newChildModel, (schema) => {
    required(schema.name, { message: 'Vul een naam in.' });
  });
  protected readonly editForm = form(this.editModel, (schema) => {
    required(schema.name, { message: 'Vul een naam in.' });
  });
  protected readonly deleteForm = form(this.deleteModel, (schema) => {
    required(schema.confirmation, { message: 'Typ de naam van het kind ter bevestiging.' });
  });
  protected readonly group = this.groupService.group;
  protected readonly members = this.memberService.members;
  protected readonly isLoading = this.memberService.isLoading;
  protected readonly loadError = this.memberService.errorMessage;
  protected readonly editingMember = computed(() =>
    this.dialogMode() === 'edit' ? this.activeMember() : null,
  );
  protected readonly deletingMember = computed(() =>
    this.dialogMode() === 'delete' ? this.activeMember() : null,
  );
  protected readonly errorMessage = this.operationError.asReadonly();
  protected readonly saving = this.isSaving.asReadonly();

  constructor() {
    effect(() => {
      const group = this.group();
      if (group) {
        this.memberService.watch(group.id);
      }
    });
  }

  protected addChild(): void {
    submit(this.newChildForm, async () => {
      const group = this.group();
      if (!group) {
        return;
      }

      await this.runOperation(() => this.memberService.add(group.id, this.newChildModel().name));
      this.newChildModel.set({ name: '' });
      this.newChildForm().reset();
    });
  }

  protected startEditing(member: IMember): void {
    this.operationError.set(null);
    this.activeMember.set(member);
    this.dialogMode.set('edit');
    this.editModel.set({ name: member.name });
    this.editForm().reset();
  }

  protected saveEdit(): void {
    submit(this.editForm, async () => {
      const group = this.group();
      const member = this.activeMember();
      if (!group || !member) {
        return;
      }

      await this.runOperation(() =>
        this.memberService.rename(group.id, member.id, this.editModel().name),
      );
      this.activeMember.set(null);
      this.dialogMode.set(null);
    });
  }

  protected startDeleting(member: IMember): void {
    this.operationError.set(null);
    this.activeMember.set(member);
    this.dialogMode.set('delete');
    this.deleteModel.set({ confirmation: '' });
    this.deleteForm().reset();
  }

  protected deleteChild(): void {
    submit(this.deleteForm, async () => {
      const group = this.group();
      const member = this.activeMember();
      if (!group || !member) {
        return;
      }
      if (this.deleteModel().confirmation.trim() !== member.name) {
        this.operationError.set('De ingevoerde naam komt niet overeen.');
        return;
      }

      await this.runOperation(() => this.memberService.remove(group.id, member.id));
      this.activeMember.set(null);
      this.dialogMode.set(null);
    });
  }

  protected closeDialog(): void {
    this.activeMember.set(null);
    this.dialogMode.set(null);
    this.operationError.set(null);
  }

  private async runOperation(operation: () => Promise<void>): Promise<void> {
    this.operationError.set(null);
    this.isSaving.set(true);
    try {
      await operation();
    } catch {
      this.operationError.set('De wijziging kon niet worden opgeslagen. Probeer het opnieuw.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
