<script setup>

const login = () => {

emit(
'login',
{
username:username.value,
password:password.value
}
)

}
</script>

<template>

<button
class="btn btn-success"
@click="login"
>
Login
</button>

</template>