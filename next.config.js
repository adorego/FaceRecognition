const { redirect } = require("next/dist/server/api-utils");


module.exports = {
    async redirects(){
        return[
            {
                source: '/',
                destination:'/inicio',
                permanent:true,
            },
        ]
    }
    
}