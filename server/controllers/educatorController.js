import {clerkClient} from '@clerk/express'

// Update roll to educator
export const updateRollToEducator = async ( req, res )=> {
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata : {
                role : 'educator',
            }
        })

        res.json({success: true, message: 'You can publish a course now'})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}