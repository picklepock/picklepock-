import { supabase } from './supabase';

/**
 * Rejoindre un match (directement ou demande d'approbation)
 */
export const joinMatch = async (match, sessionUser) => {
    if (!sessionUser) throw new Error("Vous devez être connecté pour rejoindre un match.");
    if (match.creator_id === sessionUser.id) {
        throw new Error("Vous êtes le créateur de ce match.");
    }

    // 1. Vérifier si l'utilisateur est déjà inscrit
    const { data: existing, error: checkError } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', match.id)
        .eq('user_id', sessionUser.id)
        .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
        if (existing.status === 'pending') {
            throw new Error("Votre demande de participation est déjà en cours de validation.");
        } else {
            throw new Error("Vous êtes déjà inscrit à ce match.");
        }
    }

    // 2. Vérifier le nombre actuel de participants confirmés
    const { data: participants, error: partError } = await supabase
        .from('match_participants')
        .select('user_id')
        .eq('match_id', match.id)
        .eq('status', 'confirmed');

    if (partError) throw partError;
    
    const limit = match.type === 'Simple' ? 2 : 4;
    if (participants.length >= limit) {
        throw new Error("Ce match est déjà complet.");
    }

    // 3. Inscription
    const status = match.requires_approval ? 'pending' : 'confirmed';
    const { error: insertError } = await supabase
        .from('match_participants')
        .insert([
            {
                match_id: match.id,
                user_id: sessionUser.id,
                status: status,
                team: match.type === 'Simple' ? 'B' : null // pour Simple, l'opposant est Team B
            }
        ]);

    if (insertError) throw insertError;

    // 4. Notifications
    const username = sessionUser.email ? sessionUser.email.split('@')[0] : 'Un joueur';
    if (match.requires_approval) {
        // Notifier le créateur du match
        await supabase.from('notifications').insert([
            {
                user_id: match.creator_id,
                type: 'join_request',
                title: 'Demande à rejoindre 🎾',
                content: `${username} souhaite rejoindre votre match du ${new Date(match.date).toLocaleDateString('fr-FR')} à ${match.time.slice(0, 5)}.`,
                match_id: match.id,
                actor_id: sessionUser.id
            }
        ]);
        return { status, message: "Demande de participation envoyée au créateur." };
    } else {
        // Si le match est maintenant complet (1 créateur + participants confirmés)
        const newConfirmedCount = participants.length + 1; // les participants existants + le nouveau
        if (newConfirmedCount >= limit) {
            await supabase
                .from('matches')
                .update({ status: 'full' })
                .eq('id', match.id);
        }

        // Notifier le créateur
        await supabase.from('notifications').insert([
            {
                user_id: match.creator_id,
                type: 'join_confirmed',
                title: 'Match rejoint ! 🎉',
                content: `${username} a rejoint votre match.`,
                match_id: match.id,
                actor_id: sessionUser.id
            }
        ]);
        return { status, message: "Vous avez rejoint le match avec succès !" };
    }
};

/**
 * Approuver une demande de participation
 */
export const approveJoinRequest = async (match, participantId, sessionUser) => {
    if (!sessionUser) throw new Error("Session invalide.");
    if (match.creator_id !== sessionUser.id) {
        throw new Error("Seul le créateur du match peut approuver les demandes.");
    }

    // 1. Confirmer le participant
    const { error: updateError } = await supabase
        .from('match_participants')
        .update({ status: 'confirmed' })
        .eq('match_id', match.id)
        .eq('user_id', participantId);

    if (updateError) throw updateError;

    // 2. Vérifier si le match est complet
    const { data: participants, error: partError } = await supabase
        .from('match_participants')
        .select('user_id')
        .eq('match_id', match.id)
        .eq('status', 'confirmed');

    if (partError) throw partError;

    const limit = match.type === 'Simple' ? 2 : 4;
    if (participants.length >= limit) {
        await supabase
            .from('matches')
            .update({ status: 'full' })
            .eq('id', match.id);
    }

    // 3. Notifier le participant approuvé
    await supabase.from('notifications').insert([
        {
            user_id: participantId,
            type: 'request_approved',
            title: 'Demande approuvée ! 🥳',
            content: `Le créateur a accepté votre demande de participation pour le match du ${new Date(match.date).toLocaleDateString('fr-FR')}.`,
            match_id: match.id,
            actor_id: sessionUser.id
        }
    ]);
};

/**
 * Refuser une demande de participation
 */
export const rejectJoinRequest = async (match, participantId, sessionUser) => {
    if (!sessionUser) throw new Error("Session invalide.");
    if (match.creator_id !== sessionUser.id) {
        throw new Error("Seul le créateur du match peut refuser les demandes.");
    }

    // 1. Supprimer le participant
    const { error: deleteError } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', match.id)
        .eq('user_id', participantId);

    if (deleteError) throw deleteError;

    // 2. Notifier le participant refusé
    await supabase.from('notifications').insert([
        {
            user_id: participantId,
            type: 'request_rejected',
            title: 'Demande refusée 😔',
            content: `Votre demande pour le match du ${new Date(match.date).toLocaleDateString('fr-FR')} a été refusée par l'organisateur.`,
            match_id: match.id,
            actor_id: sessionUser.id
        }
    ]);
};

/**
 * Quitter un match
 */
export const leaveMatch = async (match, sessionUser) => {
    if (!sessionUser) throw new Error("Session invalide.");
    
    // Supprimer la participation
    const { error: deleteError } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', match.id)
        .eq('user_id', sessionUser.id);

    if (deleteError) throw deleteError;

    // Repasser le match en 'open' si nécessaire
    if (match.status === 'full') {
        await supabase
            .from('matches')
            .update({ status: 'open' })
            .eq('id', match.id);
    }

    // Notifier l'organisateur
    const username = sessionUser.email ? sessionUser.email.split('@')[0] : 'Un joueur';
    await supabase.from('notifications').insert([
        {
            user_id: match.creator_id,
            type: 'leave_match',
            title: 'Joueur désinscrit ⚠️',
            content: `${username} s'est désinscrit de votre match du ${new Date(match.date).toLocaleDateString('fr-FR')}.`,
            match_id: match.id,
            actor_id: sessionUser.id
        }
    ]);
};
