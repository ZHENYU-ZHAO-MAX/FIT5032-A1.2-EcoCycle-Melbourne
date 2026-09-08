<script setup>


import { ref , onMounted  } from 'vue'


import EventCard from './components/EventCard.vue'
import ResourceCard from './components/ResourceCard.vue'
import VolunteerForm from './components/VolunteerForm.vue'
import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'

const events = ref([
  {
    id: 1,
    title: 'Community Clean-Up Day',
    date: '15 September 2026',
    location: 'Clayton',
    registered:false
  },
  {
    id: 2,
    title: 'E-Waste Collection Drive',
    date: '20 September 2026',
    location: 'Melbourne CBD',
    registered:false
  },
  {
    id: 3,
    title: 'Plastic Free Workshop',
    date: '25 September 2026',
    location: 'Glen Waverley',
    registered:false
  }
])

const resources = ref([
  {
    id: 1,
    title: 'How to Recycle Plastic',
    type: 'Guide'
  },
  {
    id: 2,
    title: 'Understanding Circular Economy',
    type: 'Article'
  },
  {
    id: 3,
    title: 'Composting Basics',
    type: 'Video'
  }
])

const registerEvent = (eventId) => {

const event =
events.value.find(
e => e.id === eventId
)

event.registered = true

}

const users = ref([
  {
    username: "admin",
    password: "admin123",
    role: "admin"
  }
])

const currentUser = ref(null)

const registerUser = (user) => {

  users.value.push(user)

  alert(
    `User ${user.username} registered successfully`
  )

}

const loginUser = (credentials) => {

  const foundUser = users.value.find(
    user =>
      user.username === credentials.username &&
      user.password === credentials.password
  )

  if(foundUser){

    currentUser.value = foundUser

    localStorage.setItem(
      'currentUser',
      JSON.stringify(foundUser)
    )

  }

}

const logout = () => {

  currentUser.value = null

  localStorage.removeItem(
    'currentUser'
  )

}

onMounted(() => {

  const savedUser =
    localStorage.getItem(
      'currentUser'
    )

  if(savedUser){

    currentUser.value =
      JSON.parse(savedUser)

  }

})

</script>

<template>

<div class="container-fluid py-5 px-5">
<div class="row justify-content-center">

<div
  class="col-12 col-lg-11 col-xl-10"
  style="max-width:1440px"
>
<div
class="
text-center
py-5
mb-5
rounded
shadow
"
style="
background:linear-gradient(
135deg,
#198754,
#20c997
);
color:white;
"
>

  <h1 class="display-2 fw-bold">
    EcoCycle Melbourne
  </h1>

  <p class="lead">
    Reduce Waste • Recycle Better
  </p>

<button
class="btn btn-light btn-lg mt-3"
>
Get Involved
</button>

</div>

<div class="row justify-content-center mt-4 mb-5">

  <div class="col-md-6">

    <RegisterForm
      @register="registerUser"
    />

  </div>

  <div class="col-md-6">

    <LoginForm
      @login="loginUser"
    />

  </div>

</div>



<div
  v-if="currentUser"
  class="alert alert-success text-center"
>

  Welcome

  <strong>
    {{ currentUser.username }}
  </strong>

  |

  Role:

  {{ currentUser.role }}

  <br>

  <button
    class="btn btn-danger mt-2"
    @click="logout"
  >
    Logout
  </button>

</div>

<div
  v-if="
    currentUser &&
    currentUser.role==='Admin'
  "
  class="
    card
    border-danger
    p-4
    mb-4
  "
>

  <h3>

    Admin Dashboard

  </h3>

  <ul>

    <li>Manage Events</li>

    <li>View Volunteer Registrations</li>

    <li>Monitor Event Ratings</li>

  </ul>

</div>

<div
  v-if="
    currentUser &&
    currentUser.role==='Volunteer'
  "
  class="
    card
    border-success
    p-4
    mb-4
  "
>

  <h3>

    Volunteer Dashboard

  </h3>

  <ul>

    <li>My Registered Events</li>

    <li>My Volunteer Activities</li>

  </ul>

</div>

<h2 class="text-center mt-5 mb-4 text-success">
  Upcoming Events
</h2>

<div class="row justify-content-center g-4">


  <div
    class="
      col-12
      col-md-6
      col-lg-4
      d-flex
    "
    v-for="event in events"
    :key="event.id"
  >

    <EventCard
:event="event"
@register-event="registerEvent"
/>

  </div>

</div>

<h2 class="text-center mt-5 mb-4 text-primary">
  Educational Resources
</h2>

<div class="row justify-content-center g-4">

  <div
    class="
      col-12
      col-md-6
      col-lg-4
      d-flex
    "
    v-for="resource in resources"
    :key="resource.id"
  >

    <ResourceCard :resource="resource"/>

  </div>

<div class="row justify-content-center mt-5">

  <div class="col-12 col-md-8 col-lg-6">

    <VolunteerForm
:events="events"
/>

  </div>
  </div>
</div>
</div>
</div>
</div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
