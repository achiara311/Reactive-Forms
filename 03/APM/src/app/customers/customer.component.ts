import { Component, OnInit } from '@angular/core';
import { FormGroup,Validators, FormBuilder,AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import { Customer } from './customer';

function emailMatcher(c: AbstractControl): {[key: string]: boolean} | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

if(emailControl.pristine || confirmControl.pristine){
  return null;
}

  if(emailControl.value === confirmControl.value){
    return null;
  }
  return {'match': true};
}

function ratingRange(min:number, max:number):ValidatorFn {
return (c: AbstractControl): {[key:string]:boolean} | null =>  {
  if(c.value !==null && (isNaN(c.value) || c.value < min || c.value >max))
  {
    //name of validation rule is in the key: range and the value:true to add it
    //to the list of validation errors. 
    return {'range': true}; //validation rule was broken, means it's invalid
  }
  return null; //null means FormControl is valid
};
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm:FormGroup; //first thing you put in html template to connect it all within a <form>
  customer = new Customer();
  emailMessage: string //emailMessage is gonna display validation message to the user from ValidationMessages

  get addresses(): FormArray{
    return <FormArray> this.customerForm.get('addresses');
  }

private ValidationMessages = {
  required: 'Please enter your email address.',
  email: 'Please enter a valid email address.'
  //available validation messages that the emailMessage property is gonna use when they're mapped together
};

  constructor(private fb: FormBuilder) { }

  ngOnInit() {//root FormGroup
 this.customerForm = this.fb.group({
   //below are form controls
   firstName:['',[Validators.required, Validators.minLength(3)]], //min length of 3 for first name
   lastName: ['',[Validators.required, Validators.maxLength(50)]],
   emailGroup: this.fb.group({//nested form group
    email: ['',[Validators.required, Validators.email]],
    confirmEmail:['',Validators.required],
   },{validator: emailMatcher}),
   phone: '', //FormControls for each address block input element to our form model using the FormBuilder
   notification: 'email',
   rating:[null,ratingRange(1,5)],
   sendCatalog: true,
   addresses:this.fb.array([this.buildAddress()])
  });

 //This code BELOW must be after the definition of the root formGroup;
 //otherwise, the reference is null

this.customerForm.get('notification').valueChanges.subscribe(
  value => this.setNotification(value)
  //no longer rely on html to notify us of changes to the input element
);

const emailControl = this.customerForm.get('emailGroup.email');//minimizes repeated code

//watcher
emailControl.valueChanges.pipe(
  debounceTime(1000)
).subscribe(
  value => this.setMessage(emailControl)
); //when you're typing email, it wont go red right away
}

addAddress(): void{ //we call this method to create an instance of the FormGroup and add it to our FormArray. 
  this.addresses.push(this.buildAddress());
}

  buildAddress():FormGroup{
    return this.fb.group({
    addressType:'home',
    street1:'',
    street2:'',
    city:'',
    state:'',
    zip:''
    })
  }

  populateTestData():void {
    this.customerForm.patchValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      sendCatalog: false
    });
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setMessage(c: AbstractControl):void{
    this.emailMessage = '';
    if((c.touched || c.dirty) && c.errors){

      //do it like this to see error messages pop up
      console.log('this is my message for testing errors',Object.keys(c.errors));
      this.emailMessage = Object.keys(c.errors).map(
        key => this.ValidationMessages[key]).join('');
    }
    //emailMessage then goes into our HTML template at line 87
  }
  //notifyViaEmailOrPhone is a string defining which radio button was clicked
  //Email or text function
  setNotification(notifyViaEmailOrPhone:string){
    const phoneControl = this.customerForm.get('phone');
    if(notifyViaEmailOrPhone === 'text')
    {
      phoneControl.setValidators(Validators.required);
    }
    else{
      phoneControl.clearValidators(); //when the user clicks the email button in this case
      //we remove the validation rule from the phone FormControl
    }
    phoneControl.updateValueAndValidity();
  }
}
