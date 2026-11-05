var e={"What can Reactive Forms do in a real-time application?":{summary:"Reactive Forms give you a model-driven, observable form state in the component class. Because every control exposes `valueChanges` and `statusChanges` streams, you can react to input in real time — live validation, debounced search/autosave, dependent fields, async server checks, dynamic add/remove of controls — and test all of it without a DOM.",details:[{type:`paragraph`,text:"In Template-driven forms the form model is created implicitly by directives in the template. In Reactive Forms you build the model (`FormGroup`, `FormControl`, `FormArray`) explicitly in TypeScript, so the source of truth is synchronous, strongly typed (since Angular 14) and fully under your control. The template only binds to it."},{type:`heading3`,text:`Real-time capabilities`},{type:`bullets`,items:["**Live validation** — sync validators run on every change; errors are available immediately via `control.errors` / `hasError()`.",'**Async validation** — e.g. "username already taken" checked against the server, with `pending` status while it runs.',"**Reacting to changes** — `valueChanges` lets you debounce, filter and switch to HTTP calls (type-ahead search, autosave drafts).",`**Dependent fields** — enable/disable or re-validate one control when another changes (country → state, "other" → free text).`,"**Dynamic structure** — add/remove controls at runtime with `FormArray`, `addControl`, `removeControl`, `setControl`.",`**Cross-field validation** — group-level validators (password + confirm password, start date < end date).`,'**Programmatic updates** — `setValue`, `patchValue`, `reset`, `markAllAsTouched` for server data, sockets or "load draft".']},{type:`heading3`,text:`Example: autosave + live username check`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-form.html',
})
export class ProfileForm {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ProfileApi);
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)], [usernameTaken(this.api)]],
    email: ['', [Validators.required, Validators.email]],
    bio: [''],
  });

  constructor() {
    // Autosave a draft 1s after the user stops typing, only when valid
    this.form.valueChanges
      .pipe(
        debounceTime(1000),
        filter(() => this.form.valid),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap((value) => this.api.saveDraft(value)), // cancels a stale save
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}

// Async validator: runs after sync validators pass; status is 'PENDING' meanwhile
export function usernameTaken(api: ProfileApi): AsyncValidatorFn {
  return (control) =>
    timer(400).pipe( // debounce: Angular re-subscribes on every change
      switchMap(() => api.isTaken(control.value)),
      map((taken) => (taken ? { usernameTaken: true } : null)),
      catchError(() => of(null)),
    );
}`},{type:`code`,lang:`html`,code:`<form [formGroup]="form">
  <input formControlName="username" />
  @if (form.controls.username.pending) { <small>Checking\u2026</small> }
  @if (form.controls.username.hasError('usernameTaken')) {
    <small class="error">That username is taken</small>
  }
</form>`},{type:`heading3`,text:`Bridging to signals`},{type:`code`,lang:`typescript`,code:`// Use form streams in signal-based templates/computeds
formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
canSubmit = toSignal(this.form.statusChanges.pipe(map((s) => s === 'VALID')), { initialValue: false });`},{type:`flow`,title:`Real-time flow of a reactive control`,code:`flowchart LR
  U[User types]:::client --> C[FormControl value]
  C --> V[Sync validators]
  V -->|valid| A[Async validator]:::server
  A --> S[statusChanges]
  C --> VC[valueChanges]
  VC --> D["debounce + switchMap"]:::highlight
  D --> API[(Autosave API)]:::db
  S --> T[Template shows errors]:::client`},{type:`callout`,variant:`tip`,text:'Interview tip: anchor the answer in a concrete feature you built — e.g. "a claims form with autosave, dependent dropdowns and a server-side duplicate check" — and mention unsubscribing (`takeUntilDestroyed`) and `switchMap` for cancelling stale requests.'}]},"Difference between setValue and patchValue":{summary:"`setValue` replaces the value of a FormGroup/FormArray and requires an object that matches the whole structure exactly — missing or extra keys throw an error. `patchValue` updates only the keys you pass and silently ignores unknown ones. Use `setValue` when you have the complete model, `patchValue` for partial updates.",details:[{type:`paragraph`,text:"On a single `FormControl` both behave the same. The difference is on groups and arrays: `setValue` is strict (a safety net that catches shape mismatches early), while `patchValue` is lenient."},{type:`code`,lang:`typescript`,code:`form = new FormGroup({
  firstName: new FormControl(''),
  lastName: new FormControl(''),
  address: new FormGroup({ city: new FormControl(''), zip: new FormControl('') }),
});

// \u2705 setValue with the full structure
this.form.setValue({ firstName: 'Asha', lastName: 'Rao', address: { city: 'Pune', zip: '411001' } });

// \u274C setValue with a partial object
this.form.setValue({ firstName: 'Asha' });
// Error: NG01002: Must supply a value for form control with name: 'lastName'

// \u2705 patchValue updates only what you pass (nested too)
this.form.patchValue({ address: { city: 'Mumbai' } });
// firstName, lastName, zip unchanged

// \u2705 patchValue ignores keys that don't exist (e.g. extra fields from an API)
this.form.patchValue({ firstName: 'Ravi', createdAt: '2026-01-01' }); // createdAt ignored`},{type:`heading3`,text:`Shared options`},{type:`code`,lang:`typescript`,code:`// Don't fire valueChanges (avoid loops when syncing two controls)
this.form.patchValue(data, { emitEvent: false });

// Only update this control, not the parent's value/validity
this.form.controls.firstName.setValue('X', { onlySelf: true });`},{type:`bullets`,items:[`**setValue** — strict, full shape, throws on missing/extra keys. Good for "load the complete entity into the edit form".`,`**patchValue** — partial, lenient, ignores unknown keys. Good for API responses with extra fields, or updating one section.`,"Both trigger `valueChanges` and re-run validation unless `emitEvent: false` is passed.","`reset(value?)` is a third option: sets values AND marks the form pristine/untouched.","With typed forms, `setValue` requires the full typed shape at compile time; `patchValue` accepts `Partial` of it."]},{type:`callout`,variant:`warning`,text:"Pitfall: `patchValue` on a FormArray does not add new items. If the server returns 5 addresses but the array has 2 controls, only 2 are patched — create/remove controls first, then patch."}]},"How to implement Dynamic Forms in Angular using FormArray?":{summary:'A `FormArray` holds an ordered, variable-length list of controls or groups. You expose it via a getter, push/remove `FormGroup`s at runtime (`push`, `removeAt`, `insert`, `clear`), and render it in the template with `formArrayName` plus `@for` and `[formGroupName]="$index"`.',details:[{type:`paragraph`,text:"Use a FormArray whenever the user decides how many items there are: phone numbers, invoice line items, education history, team members. Each item is usually a `FormGroup` so it can have several fields and its own validators."},{type:`heading3`,text:`Component`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './invoice-form.html',
})
export class InvoiceForm {
  private fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    customer: ['', Validators.required],
    items: this.fb.array([this.createItem()], Validators.minLength(1)),
  });

  get items() {
    return this.form.controls.items; // FormArray<FormGroup<...>>, fully typed
  }

  createItem(item?: { name: string; qty: number; price: number }) {
    return this.fb.group({
      name: [item?.name ?? '', Validators.required],
      qty: [item?.qty ?? 1, [Validators.required, Validators.min(1)]],
      price: [item?.price ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem() { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); }

  // Loading an existing invoice: rebuild the array to match the data
  load(invoice: Invoice) {
    this.items.clear();
    invoice.items.forEach((it) => this.items.push(this.createItem(it)));
    this.form.patchValue({ customer: invoice.customer });
  }

  total() {
    return this.items.getRawValue().reduce((sum, it) => sum + it.qty * it.price, 0);
  }
}`},{type:`heading3`,text:`Template`},{type:`code`,lang:`html`,code:`<form [formGroup]="form" (ngSubmit)="save()">
  <input formControlName="customer" placeholder="Customer" />

  <div formArrayName="items">
    @for (item of items.controls; track item; let i = $index) {
      <div [formGroupName]="i" class="row">
        <input formControlName="name" placeholder="Item" />
        <input type="number" formControlName="qty" />
        <input type="number" formControlName="price" />
        <button type="button" (click)="removeItem(i)" [disabled]="items.length === 1">\u2715</button>
      </div>
    }
  </div>

  <button type="button" (click)="addItem()">+ Add item</button>
  <p>Total: {{ total() | currency }}</p>
  <button [disabled]="form.invalid">Save</button>
</form>`},{type:`bullets`,items:["Track by the control object (`track item`), not `$index`, so DOM rows move correctly when an item is removed from the middle.","Array methods: `push`, `insert(i, ctrl)`, `removeAt(i)`, `setControl(i, ctrl)`, `clear()`, `at(i)`, `length`.",'Validators can be placed on the array itself (e.g. `minLength(1)`, or a custom "no duplicate names" validator).','Legacy syntax: `*ngFor="let item of items.controls; let i = index"` — same idea.','Use `type="button"` on add/remove buttons, otherwise they submit the form.']},{type:`callout`,variant:`tip`,text:"Interview tip: mention that `patchValue` does not grow a FormArray — when loading data you must `clear()` and push one group per item. Interviewers often probe this."}]},"What is setControl in FormArray?":{summary:"`formArray.setControl(index, control)` replaces the control at a given index with a new control instance (it is `removeAt` + `insert` in one step, with a single `valueChanges` emission). On a FormGroup, `setControl(name, control)` does the same by key. It is useful to swap a whole item or reset an array with fresh controls.",details:[{type:`paragraph`,text:"Unlike `setValue`/`patchValue`, which change the value of the existing control, `setControl` swaps the control object itself — including its validators, enabled/disabled state, and pristine/touched flags. Any subscriptions to the old control's `valueChanges` do not move over to the new one."},{type:`code`,lang:`typescript`,code:`const phones = new FormArray([
  new FormControl('111', Validators.required),
  new FormControl('222', Validators.required),
]);

// Replace item at index 1 with a brand-new control (different validators)
phones.setControl(1, new FormControl('+91 98765 43210', [Validators.required, Validators.pattern(/^\\+\\d/)]));

console.log(phones.value); // ['111', '+91 98765 43210']

// FormGroup version: replace a whole nested array (common when loading data)
form.setControl('phones', new FormArray(user.phones.map((p) => new FormControl(p))));`},{type:`heading3`,text:`When to use it`},{type:`bullets`,items:[`Switch an item to a different shape — e.g. a "payment method" row changes from card fields to UPI fields.`,"Load server data into a FormArray in one shot: `form.setControl('items', fb.array(data.map(createItem)))`.",`Reset a single row to a fresh, pristine control after "discard changes".`,"Compare: `setValue` = new value, same control. `setControl` = new control. `insert/removeAt` = change length.","Options: `setControl(i, ctrl, { emitEvent: false })` suppresses the change event."]},{type:`callout`,variant:`warning`,text:"Pitfall: if the component stored a reference to the old control or subscribed to its `valueChanges`, that reference is now stale after `setControl`. Re-read controls through the parent (`items.at(i)`) instead of caching them."}]},"How to implement a dynamic form where input fields are shown/hidden based on selection?":{summary:"Listen to the selector control's `valueChanges` and, for each dependent field, both **show/hide it in the template** with `@if` and **enable/disable it in the form model** (or add/remove the control). Disabling is key: a disabled control is excluded from `form.value` and its validators do not run, so hidden required fields don't block submission.",details:[{type:`paragraph`,text:"Hiding a field with `@if` alone is a common bug: the control still exists in the model, its `Validators.required` still fails, and the form stays invalid even though the user cannot see the field. The fix is to keep the model and the view in sync."},{type:`heading3`,text:`Example: payment method → card or UPI fields`},{type:`code`,lang:`typescript`,code:`export class CheckoutForm {
  private fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    method: ['card' as 'card' | 'upi' | 'cod'],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\\d{16}$/)]],
    upiId: [{ value: '', disabled: true }, Validators.required],
  });

  // Signal for the template, derived from the form
  method = toSignal(this.form.controls.method.valueChanges, {
    initialValue: this.form.controls.method.value,
  });

  constructor() {
    this.form.controls.method.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((m) => this.toggleFields(m));
  }

  private toggleFields(method: 'card' | 'upi' | 'cod') {
    const { cardNumber, upiId } = this.form.controls;
    method === 'card' ? cardNumber.enable() : cardNumber.disable();
    method === 'upi' ? upiId.enable() : upiId.disable();
    // cod \u2192 both disabled \u2192 excluded from form.value, validators skipped
  }
}`},{type:`code`,lang:`html`,code:`<form [formGroup]="form">
  <select formControlName="method">
    <option value="card">Card</option>
    <option value="upi">UPI</option>
    <option value="cod">Cash on delivery</option>
  </select>

  @if (method() === 'card') {
    <input formControlName="cardNumber" placeholder="Card number" />
  }
  @if (method() === 'upi') {
    <input formControlName="upiId" placeholder="name@bank" />
  }
  <button [disabled]="form.invalid">Pay</button>
</form>`},{type:`heading3`,text:`Alternatives`},{type:`bullets`,items:["**enable/disable** (above) — keeps values when the user toggles back; simplest. Use `getRawValue()` if you ever need disabled values.",`**addControl/removeControl** — the control truly does not exist when hidden; good when the field set varies a lot. Type it as optional in typed forms.`,"**Swap validators** — `setValidators()` / `clearValidators()` then `updateValueAndValidity()`; keeps the field visible-but-optional.","Prefer `[formControlName]` + `disabled()` methods over the `[disabled]` attribute — Angular warns when you mix them on reactive controls."]},{type:`flow`,title:`Keeping view and model in sync`,code:`flowchart LR
  S[method valueChanges]:::client --> T{Selected value}
  T -->|card| C["enable cardNumber<br/>disable upiId"]:::highlight
  T -->|upi| U["enable upiId<br/>disable cardNumber"]:::highlight
  T -->|cod| N[disable both]
  C --> V[form.valid recalculated]
  U --> V
  N --> V
  V --> R["@if renders matching inputs"]:::client`},{type:`callout`,variant:`warning`,text:"Pitfall: hiding with CSS or `@if` without disabling the control. The hidden required field keeps the form invalid and its stale value still gets submitted."}]},"How would you build a dynamic form using JSON configuration instead of hardcoding controls?":{summary:"Define a typed field config (key, type, label, validators, options, visibility rules), loop over it to build a `FormGroup` with `FormControl`s and mapped validators, and render each field with `@for` + `@switch` on its type (or a small field component per type). The form becomes data — it can come from the server, a CMS, or a JSON file.",details:[{type:`paragraph`,text:`This is the classic "form engine" pattern used for surveys, insurance/KYC flows and admin-configurable screens. Three pieces: a config schema, a builder service that turns config into a FormGroup, and a renderer that turns config into inputs.`},{type:`heading3`,text:`1. Config schema`},{type:`code`,lang:`typescript`,code:`export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'date';
  value?: unknown;
  options?: { label: string; value: string }[];
  validators?: { required?: boolean; minLength?: number; max?: number; pattern?: string };
  showIf?: { field: string; equals: unknown }; // conditional visibility
}

// e.g. loaded from GET /api/forms/kyc
const kycConfig: FieldConfig[] = [
  { key: 'fullName', label: 'Full name', type: 'text', validators: { required: true, minLength: 3 } },
  { key: 'idType', label: 'ID type', type: 'select', options: [
      { label: 'Passport', value: 'passport' }, { label: 'PAN', value: 'pan' } ],
    validators: { required: true } },
  { key: 'passportNo', label: 'Passport no.', type: 'text',
    validators: { required: true, pattern: '^[A-Z][0-9]{7}$' },
    showIf: { field: 'idType', equals: 'passport' } },
];`},{type:`heading3`,text:`2. Builder: config → FormGroup`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class DynamicFormBuilder {
  build(fields: FieldConfig[]): FormGroup {
    const group: Record<string, FormControl> = {};
    for (const f of fields) {
      group[f.key] = new FormControl(f.value ?? null, this.mapValidators(f));
    }
    return new FormGroup(group);
  }

  private mapValidators(f: FieldConfig): ValidatorFn[] {
    const v = f.validators ?? {};
    const out: ValidatorFn[] = [];
    if (v.required) out.push(f.type === 'checkbox' ? Validators.requiredTrue : Validators.required);
    if (v.minLength != null) out.push(Validators.minLength(v.minLength));
    if (v.max != null) out.push(Validators.max(v.max));
    if (v.pattern) out.push(Validators.pattern(v.pattern));
    if (f.type === 'email') out.push(Validators.email);
    return out;
  }
}`},{type:`heading3`,text:`3. Renderer`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-dynamic-form',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form()" (ngSubmit)="submitted.emit(form().value)">
      @for (f of fields(); track f.key) {
        @if (isVisible(f)) {
          <label>{{ f.label }}</label>
          @switch (f.type) {
            @case ('select') {
              <select [formControlName]="f.key">
                @for (o of f.options; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
              </select>
            }
            @case ('checkbox') { <input type="checkbox" [formControlName]="f.key" /> }
            @default { <input [type]="f.type" [formControlName]="f.key" /> }
          }
        }
      }
      <button [disabled]="form().invalid">Submit</button>
    </form>
  \`,
})
export class DynamicForm {
  fields = input.required<FieldConfig[]>();
  submitted = output<Record<string, unknown>>();
  private builder = inject(DynamicFormBuilder);
  form = computed(() => this.builder.build(this.fields()));
  private formValue = toSignal(
    toObservable(this.form).pipe(switchMap((f) => f.valueChanges.pipe(startWith(f.value)))),
  );

  isVisible(f: FieldConfig) {
    if (!f.showIf) return true;
    const visible = this.formValue()?.[f.showIf.field] === f.showIf.equals;
    const ctrl = this.form().get(f.key)!;
    // keep model in sync: hidden fields are disabled so they don't block validity
    if (visible && ctrl.disabled) ctrl.enable({ emitEvent: false });
    if (!visible && ctrl.enabled) ctrl.disable({ emitEvent: false });
    return visible;
  }
}`},{type:`flow`,title:`Form engine pipeline`,code:`flowchart LR
  J[("JSON config<br/>API or CMS")]:::db --> B[DynamicFormBuilder]:::server
  B --> G[FormGroup + validators]
  J --> R["Renderer<br/>@for + @switch"]:::client
  G --> R
  R --> U[User input]:::client
  U --> G
  G --> S[Submit value]:::highlight`},{type:`bullets`,items:["Keep the config serialisable: validators as data (`required: true`), mapped to `ValidatorFn` in code — never `eval` strings.","For larger engines, render each type via its own component (`<app-text-field>`, `<app-select-field>`) implementing `ControlValueAccessor`, or use `NgComponentOutlet` with a type→component registry.","Support nested groups/arrays by allowing `type: 'group'` with `children` and building recursively.",`Libraries like Formly implement this pattern; mention them, but show you understand the mechanics.`]},{type:`callout`,variant:`tip`,text:"Interview tip: call out that the conditional-visibility logic must also disable hidden controls, and that a side-effect inside a template method is a shortcut — in production move it into a `valueChanges`/`effect()` handler in the builder."}]},"Your form has more than 50 fields. Will you keep the complete reactive form and template inside one component?":{summary:"No. I keep **one form model** (a single root `FormGroup` owned by a parent or a form service) but split the **UI** into section components, each bound to its own nested `FormGroup`. That gives small, testable components while validation, value and submit stay in one place.",details:[{type:`paragraph`,text:`A 50-field component means a huge template, slow reviews, merge conflicts and poor reuse. But splitting the form model into 5 unrelated forms makes cross-section validation and submit painful. The balance: split by section, keep one tree.`},{type:`heading3`,text:`Approach 1: pass the nested FormGroup as an input`},{type:`code`,lang:`typescript`,code:`// parent: owns the full model
export class ApplicationForm {
  private fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    personal: this.fb.group({ firstName: ['', Validators.required], lastName: [''], dob: [''] }),
    address: this.fb.group({ line1: ['', Validators.required], city: [''], zip: [''] }),
    employment: this.fb.group({ company: [''], salary: [0] }),
  });
}

// child: renders only its section
@Component({
  selector: 'app-address-section',
  imports: [ReactiveFormsModule],
  template: \`
    <fieldset [formGroup]="group()">
      <legend>Address</legend>
      <input formControlName="line1" />
      <input formControlName="city" />
      <input formControlName="zip" />
    </fieldset>
  \`,
})
export class AddressSection {
  group = input.required<FormGroup<AddressControls>>();
}`},{type:`code`,lang:`html`,code:`<form [formGroup]="form" (ngSubmit)="submit()">
  <app-personal-section [group]="form.controls.personal" />
  <app-address-section [group]="form.controls.address" />
  <app-employment-section [group]="form.controls.employment" />
  <button [disabled]="form.invalid">Submit</button>
</form>`},{type:`heading3`,text:`Approach 2: ControlContainer (child uses formGroupName)`},{type:`code`,lang:`typescript`,code:`// Child reuses the parent's FormGroupDirective \u2014 no input needed
@Component({
  selector: 'app-address-section',
  imports: [ReactiveFormsModule],
  viewProviders: [{ provide: ControlContainer, useFactory: () => inject(ControlContainer, { skipSelf: true }) }],
  template: \`<fieldset formGroupName="address"> <input formControlName="city" /> </fieldset>\`,
})
export class AddressSection {}`},{type:`heading3`,text:`Other techniques for big forms`},{type:`bullets`,items:["**Reusable field components** implementing `ControlValueAccessor` (address, phone, date-range) — used across many forms.",`**Form service / factory** that builds the FormGroup, so the structure, defaults and validators are testable without a template.`,"**Typed forms** (`NonNullableFormBuilder`, interfaces per section) so refactors are compiler-checked.","**Lazy sections / tabs / stepper** — render only the visible section (`@defer` or `@if`) to reduce initial DOM.","**Performance** — OnPush / zoneless + signals; `updateOn: 'blur'` for expensive validators.",`**JSON config** — if many forms share the pattern, drive them from config.`]},{type:`callout`,variant:`tip`,text:'Interview tip: say "one model, many views". Explain that keeping a single root FormGroup makes cross-section validation (e.g. salary required if employed) and a single `submit()` trivial, while section components stay small and focused.'}]},"Your application has a stepper and each step is implemented in a different Angular component. How would you share the complete form across all steps?":{summary:"Create the complete `FormGroup` once — in the stepper parent or, better, in a form service provided at the stepper's component level — with one nested group per step. Each step component injects the service (or receives its nested group as an input) and binds only to its section. Step validity is just `form.controls.stepX.valid`, and the final submit reads the whole form.",details:[{type:`paragraph`,text:`The key decisions are: who owns the form (a scoped service, so it lives exactly as long as the wizard), how steps access it (inject or input), and how the stepper knows a step is complete (the nested group's validity).`},{type:`heading3`,text:`Scoped form service`},{type:`code`,lang:`typescript`,code:`@Injectable() // NOT providedIn: 'root' \u2014 one instance per wizard
export class OnboardingFormService {
  private fb = inject(NonNullableFormBuilder);
  private http = inject(HttpClient);

  readonly form = this.fb.group({
    account: this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] }),
    profile: this.fb.group({ name: ['', Validators.required], phone: [''] }),
    plan: this.fb.group({ tier: ['basic', Validators.required] }),
  });

  readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  submit() {
    return this.http.post('/api/onboarding', this.form.getRawValue());
  }
}

@Component({
  selector: 'app-onboarding',
  providers: [OnboardingFormService], // scoped to this wizard and its children
  imports: [MatStepperModule, AccountStep, ProfileStep, PlanStep],
  templateUrl: './onboarding.html',
})
export class Onboarding {
  protected svc = inject(OnboardingFormService);
  protected form = this.svc.form;
}`},{type:`code`,lang:`html`,code:`<mat-stepper linear>
  <mat-step [stepControl]="form.controls.account" label="Account">
    <app-account-step />
  </mat-step>
  <mat-step [stepControl]="form.controls.profile" label="Profile">
    <app-profile-step />
  </mat-step>
  <mat-step [stepControl]="form.controls.plan" label="Plan">
    <app-plan-step />
    <button (click)="save()" [disabled]="form.invalid">Finish</button>
  </mat-step>
</mat-stepper>`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-account-step',
  imports: [ReactiveFormsModule],
  template: \`
    <div [formGroup]="group">
      <input formControlName="email" />
      <input type="password" formControlName="password" />
      <button matStepperNext [disabled]="group.invalid">Next</button>
    </div>
  \`,
})
export class AccountStep {
  // Same instance as the parent \u2014 state survives moving back and forth
  protected group = inject(OnboardingFormService).form.controls.account;
}`},{type:`flow`,title:`Ownership in a multi-step form`,code:`flowchart TD
  P["Onboarding (stepper)<br/>providers: FormService"]:::highlight --> S[(FormService.form)]:::cache
  S --> A[account group]
  S --> B[profile group]
  S --> C[plan group]
  A --> SA[AccountStep]:::client
  B --> SB[ProfileStep]:::client
  C --> SC[PlanStep]:::client
  S --> API[Submit full value]:::server`},{type:`bullets`,items:["Provide the service at the stepper component level so state resets when the user leaves the wizard; use `providedIn: 'root'` only if the draft must survive navigation.","If steps are separate **routes**, provide the service on the parent route (`providers` in the route config) so child routes share one instance.","Persist drafts with `valueChanges` → `debounceTime` → `localStorage` / API to survive refreshes.","Alternative: steps receive their nested group via `input.required<FormGroup>()` — simpler for small wizards, but the parent must wire every step.",`Avoid separate FormGroups per step merged at the end: you lose cross-step validation and have to re-sync state.`]},{type:`callout`,variant:`tip`,text:'Interview tip: mention `[stepControl]` + `linear` (Angular Material) or your own "can go next" check using the nested group\'s validity, and that `markAllAsTouched()` on the step group shows errors when the user tries to advance.'}]},"Suppose a Reactive Form contains a dropdown that gets enabled/disabled from multiple events. A defect is reported where the dropdown behaves incorrectly. How would you debug which event is changing its state?":{summary:"First reproduce it, then make the state changes observable: subscribe to the control's `statusChanges` (or `events` in Angular 18+) and log with a stack trace (`console.trace`) or set a breakpoint inside it to see exactly which code path called `enable()`/`disable()`. The real fix is usually to stop toggling from many places and derive the disabled state from **one** function of the inputs.",details:[{type:`paragraph`,text:"The bug pattern is a race between several writers — a value change in another field, an API response, a permission check, a route param — each calling `enable()` or `disable()`. The last one wins, and the order changes with timing. Debugging is about finding the writers; fixing is about having a single writer."},{type:`heading3`,text:`Step 1: trace every state change`},{type:`code`,lang:`typescript`,code:`const ctrl = this.form.controls.region;

// statusChanges emits 'DISABLED' / 'VALID' / 'INVALID' / 'PENDING'
ctrl.statusChanges.subscribe((status) => {
  console.trace('[region] status \u2192', status); // stack shows who called disable()/enable()
  // debugger; // or pause here and walk up the call stack in DevTools
});

// Angular 18+: unified events stream on every AbstractControl
// (ValueChangeEvent, StatusChangeEvent, TouchedChangeEvent, PristineChangeEvent, ...)
ctrl.events.pipe(filter((e) => e instanceof StatusChangeEvent))
  .subscribe((e) => console.log('status event', e.status, 'source:', e.source));`},{type:`heading3`,text:`Step 2: catch silent changes (emitEvent: false)`},{type:`code`,lang:`typescript`,code:`// Calls with { emitEvent: false } won't emit \u2014 temporarily wrap the methods (dev only!)
const origDisable = ctrl.disable.bind(ctrl);
const origEnable = ctrl.enable.bind(ctrl);
ctrl.disable = (opts) => { console.trace('[region] disable()', opts); origDisable(opts); };
ctrl.enable  = (opts) => { console.trace('[region] enable()', opts);  origEnable(opts); };`},{type:`heading3`,text:`Step 3: other checks`},{type:`bullets`,items:["Search the codebase for `region.disable`, `get('region')`, `[disabled]` on the element, and parent `form.disable()/enable()` — enabling a parent group enables ALL children.",'Check for `[disabled]="..."` binding on a reactive control — mixing it with `disable()` causes conflicting writers (Angular logs a warning).',`Look for subscriptions that are never unsubscribed — a component recreated twice can have two live handlers toggling the same control.`,`Use DevTools "Event Listener Breakpoints" or the Angular DevTools profiler to see which change-detection cycle/event preceded the change.`,`Write a unit test that fires the events in different orders to reproduce deterministically.`]},{type:`heading3`,text:`Step 4: the fix — single source of truth`},{type:`code`,lang:`typescript`,code:`// Combine every input that affects the dropdown, decide in ONE place
const country = this.form.controls.country;
combineLatest([
  country.valueChanges.pipe(startWith(country.value)),
  this.auth.canEditRegion$,          // permission
  this.regionsLoaded$,               // API state
])
  .pipe(
    map(([c, canEdit, loaded]) => !!c && canEdit && loaded),
    distinctUntilChanged(),
    takeUntilDestroyed(),
  )
  .subscribe((enabled) =>
    enabled ? this.form.controls.region.enable({ emitEvent: false })
            : this.form.controls.region.disable({ emitEvent: false }),
  );`},{type:`flow`,title:`From many writers to one`,code:`flowchart LR
  E1[country change]:::client --> D
  E2[permission check]:::security --> D
  E3[API loaded]:::server --> D
  D["combineLatest + map<br/>isEnabled(...)"]:::highlight --> R[region.enable / disable]
  R --> UI[Dropdown]:::client`},{type:`callout`,variant:`tip`,text:"Interview tip: structure the answer as reproduce → instrument (`statusChanges` + `console.trace`/breakpoint) → identify writers → refactor to a single derived rule → add a regression test. That shows debugging discipline, not just an API name."}]}};export{e as answers};