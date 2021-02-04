<template>
<div>
    <div id="settings-dialog">
        <h1>Settings</h1>
        <div>
            <label>Backend url</label> <input type="url" v-model="url" />
        </div>
        <div style="text-align: right">
            <button class="btn btn-danger" @click="$emit('cancel')">Cancel</button>
            <button class="btn btn-success" @click="$emit('ok', { url: url })">Ok</button>
        </div>
    </div>
    <div id="settings-dialog-bg"></div>
</div>
</template>

<script>
export default {
    name: 'app-settings',
    props: {
        backendUrl: String
    },
    data() {
        return {
            url: this.backendUrl
        };
    }
}
</script>

<style scoped>
#settings-dialog {
    position: fixed;
    left: 50%;
    top: 5rem;
    transform: translateX(-50%);
    padding: 2rem;
    background-color: white;
    border: 1px solid black;
    border-radius: 1rem;
    z-index: 9999;
}

#settings-dialog > div {
    margin-top: 1rem;
}

#settings-dialog button {
    margin-left: 1rem;
}

#settings-dialog-bg {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vh;
    height: 100vh;
    background-color: gray;
    opacity: 0.8;
}
</style>