Meteor.methods({
    updateData: function(color) {
        Ambient.update({
            'mood': "current",
        }, {$set: {
            'color': color
        }}, {
        	upsert: true
        });
    }
});