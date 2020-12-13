<template>    
    <div class="row header">
        <div class="col">
            <img src="@/assets/logo.png" alt="logo" class="float-left" />
            <h1 class="float-left">GH Ticker</h1>
        </div>
        <div class="col">
            <a class="float-right btn btn-success" v-if="!showTokenInput" @click="showTokenInput=true">{{username||'login'}}</a>
            <img class="float-right avatar" :src="avatarUrl" v-if="avatarUrl && !showTokenInput" />
            <input class="float-right" type="text" v-if="showTokenInput" v-model="oldToken" @change="tokenChanged" @blur="showTokenInput=false" />
        </div>
    </div>
</template>

<script>
export default {
    name: 'app-header',
    props: {
        username: String,
        token: String,
        avatarUrl: String
    },
    data() {
        return {
            showTokenInput: false
        };
    },
    methods: {
        tokenChanged(e) {
            const newToken = e.target.value;
            if (newToken !== this.oldToken) {
                this.$emit('changed', newToken);
            }
            this.showTokenInput=false;
        }
    },
    computed: {
        oldToken() {
            return this.token;
        }
    }
};
</script>

<style scoped>
    .header {
        height: 46px;
        overflow: hidden;
        padding: 3px 38px;
        background-color: lightblue;
        border-bottom: 2px solid blue;
    }

    img {
        height: 40px;
    }

    h1 {
        font-size: 36px;
        margin: 0 1em 0 1em;
    }

    .avatar {
        margin-right: 3px;
        height: 38px;
        border-radius: 5px;
    }
</style>